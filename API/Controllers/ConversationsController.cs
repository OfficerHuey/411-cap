using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Messages;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConversationsController : ControllerBase
    {
        private readonly DataContext _context;
        private const int MaxContentLength = 4000;

        public ConversationsController(DataContext context)
        {
            _context = context;
        }

        //lookup the authenticated user's row; returns null for unauth callers
        private async Task<AppUser?> GetCurrentUserAsync()
        {
            var username = User.GetUsername();
            if (string.IsNullOrEmpty(username)) return null;
            return await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
        }

        //initials from display name or username (e.g. "Jane Doe" -> "JD")
        private static string InitialsOf(AppUser u)
        {
            var source = !string.IsNullOrWhiteSpace(u.DisplayName) ? u.DisplayName! : u.UserName;
            var parts = source.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "?";
            if (parts.Length == 1) return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            return ($"{parts[0][0]}{parts[^1][0]}").ToUpper();
        }

        private static ConversationParticipantDto ToParticipantDto(AppUser u) => new()
        {
            UserId = u.Id,
            DisplayName = string.IsNullOrWhiteSpace(u.DisplayName) ? u.UserName : u.DisplayName!,
            Initials = InitialsOf(u),
            Role = u.Role,
        };

        //list the caller's conversations with last-message preview + unread count
        [HttpGet]
        public async Task<ActionResult<List<ConversationDto>>> List()
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            //conversations where i'm a participant, ordered newest-activity first
            var rows = await _context.Conversations
                .Where(c => c.Participants.Any(p => p.UserId == me.Id))
                .OrderByDescending(c => c.LastMessageAt)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.IsGroupChat,
                    c.LastMessageAt,
                    //most recent message (if any) for the preview
                    LastMessage = c.Messages
                        .Where(m => !m.IsDeleted)
                        .OrderByDescending(m => m.SentAt)
                        .Select(m => new { m.Content, m.SentAt })
                        .FirstOrDefault(),
                    MyLastReadAt = c.Participants
                        .Where(p => p.UserId == me.Id)
                        .Select(p => p.LastReadAt)
                        .FirstOrDefault(),
                    UnreadCount = c.Messages.Count(m =>
                        !m.IsDeleted &&
                        m.SenderId != me.Id &&
                        (c.Participants
                            .Where(p => p.UserId == me.Id)
                            .Select(p => p.LastReadAt).FirstOrDefault() == null ||
                         m.SentAt > c.Participants
                            .Where(p => p.UserId == me.Id)
                            .Select(p => p.LastReadAt).FirstOrDefault())),
                    Participants = c.Participants.Select(p => p.User).ToList(),
                })
                .ToListAsync();

            var result = rows.Select(r => new ConversationDto
            {
                Id = r.Id,
                Title = r.Title,
                IsGroupChat = r.IsGroupChat,
                LastMessagePreview = TrimPreview(r.LastMessage?.Content),
                LastMessageAt = r.LastMessage?.SentAt ?? r.LastMessageAt,
                UnreadCount = r.UnreadCount,
                Participants = r.Participants.Select(ToParticipantDto).ToList(),
            }).ToList();

            return Ok(result);
        }

        //total unread count across all the caller's conversations
        [HttpGet("unread-count")]
        public async Task<ActionResult<UnreadCountDto>> UnreadCount()
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            //count messages sent by others after my LastReadAt across every
            //conversation i'm in. one round-trip sql
            var count = await _context.Messages
                .Where(m => !m.IsDeleted && m.SenderId != me.Id)
                .Where(m => m.Conversation.Participants.Any(p => p.UserId == me.Id))
                .Where(m => m.Conversation.Participants
                    .Where(p => p.UserId == me.Id)
                    .Any(p => p.LastReadAt == null || m.SentAt > p.LastReadAt))
                .CountAsync();

            return Ok(new UnreadCountDto { Count = count });
        }

        //get one conversation's metadata + participant list
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ConversationDto>> Get(int id)
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            var conv = await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null) return NotFound();
            if (!conv.Participants.Any(p => p.UserId == me.Id)) return Forbid();

            var myParticipant = conv.Participants.First(p => p.UserId == me.Id);
            var unread = await _context.Messages
                .Where(m => m.ConversationId == id && !m.IsDeleted && m.SenderId != me.Id)
                .Where(m => myParticipant.LastReadAt == null || m.SentAt > myParticipant.LastReadAt)
                .CountAsync();

            var last = conv.Messages.FirstOrDefault();
            return Ok(new ConversationDto
            {
                Id = conv.Id,
                Title = conv.Title,
                IsGroupChat = conv.IsGroupChat,
                LastMessagePreview = TrimPreview(last?.Content),
                LastMessageAt = last?.SentAt ?? conv.LastMessageAt,
                UnreadCount = unread,
                Participants = conv.Participants.Select(p => ToParticipantDto(p.User)).ToList(),
            });
        }

        //paged messages in a conversation, chronological oldest-first
        [HttpGet("{id:int}/messages")]
        public async Task<ActionResult<MessagesPageDto>> Messages(
            int id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            var conv = await _context.Conversations
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null) return NotFound();
            if (!conv.Participants.Any(p => p.UserId == me.Id)) return Forbid();

            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 500) pageSize = 100;

            //paging here goes newest-first so "page 1" is the most recent N
            //messages. we then reverse for the client so the oldest message
            //in the page renders at the top of the thread
            var q = _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == id && !m.IsDeleted);
            var total = await q.CountAsync();
            var slice = await q
                .OrderByDescending(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            slice.Reverse();

            return Ok(new MessagesPageDto
            {
                Items = slice.Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    SenderId = m.SenderId,
                    SenderName = string.IsNullOrWhiteSpace(m.Sender.DisplayName)
                        ? m.Sender.UserName : m.Sender.DisplayName!,
                    SenderInitials = InitialsOf(m.Sender),
                    Content = m.Content,
                    SentAt = m.SentAt,
                }).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            });
        }

        //create a new conversation. 1-participant list => DM (or reuses an
        //existing DM between the two users). n-participant list => group
        [HttpPost]
        public async Task<ActionResult<ConversationDto>> Create([FromBody] CreateConversationDto dto)
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            //normalize: always include the caller, drop duplicates + self
            var otherIds = (dto.ParticipantUserIds ?? new List<int>())
                .Distinct()
                .Where(id => id != me.Id)
                .ToList();
            if (otherIds.Count == 0)
                return BadRequest("Pick at least one other user.");

            //verify participants exist
            var others = await _context.Users
                .Where(u => otherIds.Contains(u.Id))
                .ToListAsync();
            if (others.Count != otherIds.Count)
                return BadRequest("One or more participants were not found.");

            var isGroup = otherIds.Count > 1;

            //for DMs, reuse any existing 1:1 conversation between the pair
            if (!isGroup)
            {
                var otherId = otherIds[0];
                var existing = await _context.Conversations
                    .Include(c => c.Participants).ThenInclude(p => p.User)
                    .Where(c => !c.IsGroupChat)
                    .Where(c => c.Participants.Count == 2)
                    .Where(c => c.Participants.Any(p => p.UserId == me.Id))
                    .Where(c => c.Participants.Any(p => p.UserId == otherId))
                    .FirstOrDefaultAsync();
                if (existing != null)
                {
                    //if an initial message was supplied, append it to the reused thread
                    if (!string.IsNullOrWhiteSpace(dto.InitialMessage))
                    {
                        var appended = await AppendMessageAsync(existing, me, dto.InitialMessage!);
                        if (appended is BadRequestObjectResult bad) return bad;
                    }
                    return Ok(await BuildConversationDto(existing.Id, me.Id));
                }
            }

            //fresh conversation with all participants
            var now = DateTime.UtcNow;
            var conv = new Conversation
            {
                Title = isGroup ? (dto.Title?.Trim()) : null,
                IsGroupChat = isGroup,
                CreatedAt = now,
                LastMessageAt = now,
            };
            conv.Participants.Add(new ConversationParticipant { UserId = me.Id, JoinedAt = now });
            foreach (var id in otherIds)
                conv.Participants.Add(new ConversationParticipant { UserId = id, JoinedAt = now });

            _context.Conversations.Add(conv);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(dto.InitialMessage))
            {
                var appended = await AppendMessageAsync(conv, me, dto.InitialMessage!);
                if (appended is BadRequestObjectResult bad) return bad;
            }

            return Ok(await BuildConversationDto(conv.Id, me.Id));
        }

        //post a new message to a conversation
        [HttpPost("{id:int}/messages")]
        public async Task<ActionResult<MessageDto>> Send(int id, [FromBody] SendMessageDto dto)
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            var conv = await _context.Conversations
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (conv == null) return NotFound();
            if (!conv.Participants.Any(p => p.UserId == me.Id)) return Forbid();

            var result = await AppendMessageAsync(conv, me, dto?.Content ?? string.Empty);
            if (result is BadRequestObjectResult bad) return bad;
            //AppendMessageAsync returns the saved message via the out variable
            //below; since the helper returned Ok() already, re-query for the DTO
            var saved = await _context.Messages
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentAt)
                .FirstAsync(m => m.ConversationId == id && m.SenderId == me.Id);
            return Ok(new MessageDto
            {
                Id = saved.Id,
                ConversationId = saved.ConversationId,
                SenderId = saved.SenderId,
                SenderName = string.IsNullOrWhiteSpace(saved.Sender.DisplayName)
                    ? saved.Sender.UserName : saved.Sender.DisplayName!,
                SenderInitials = InitialsOf(saved.Sender),
                Content = saved.Content,
                SentAt = saved.SentAt,
            });
        }

        //mark the conversation fully read for the caller
        [HttpPut("{id:int}/read")]
        public async Task<IActionResult> MarkRead(int id)
        {
            var me = await GetCurrentUserAsync();
            if (me == null) return Unauthorized();

            var participant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == id && p.UserId == me.Id);
            if (participant == null) return NotFound();

            participant.LastReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //append helper — writes the message, bumps LastMessageAt, and resets
        //the caller's LastReadAt so they don't register as "unread" to themselves
        private async Task<IActionResult> AppendMessageAsync(Conversation conv, AppUser sender, string content)
        {
            var trimmed = (content ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                return BadRequest("Message content is required.");
            if (trimmed.Length > MaxContentLength)
                return BadRequest($"Message too long (max {MaxContentLength} characters).");

            var now = DateTime.UtcNow;
            var msg = new Message
            {
                ConversationId = conv.Id,
                SenderId = sender.Id,
                Content = trimmed,
                SentAt = now,
            };
            _context.Messages.Add(msg);
            conv.LastMessageAt = now;

            //bump the sender's LastReadAt so the new message doesn't count
            //as unread for them on the very next list query
            var senderParticipant = await _context.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conv.Id && p.UserId == sender.Id);
            if (senderParticipant != null)
                senderParticipant.LastReadAt = now;

            await _context.SaveChangesAsync();
            return Ok();
        }

        private async Task<ConversationDto> BuildConversationDto(int conversationId, int myUserId)
        {
            var conv = await _context.Conversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .FirstAsync(c => c.Id == conversationId);

            var myParticipant = conv.Participants.First(p => p.UserId == myUserId);
            var unread = await _context.Messages
                .Where(m => m.ConversationId == conversationId && !m.IsDeleted && m.SenderId != myUserId)
                .Where(m => myParticipant.LastReadAt == null || m.SentAt > myParticipant.LastReadAt)
                .CountAsync();

            var last = conv.Messages.FirstOrDefault();
            return new ConversationDto
            {
                Id = conv.Id,
                Title = conv.Title,
                IsGroupChat = conv.IsGroupChat,
                LastMessagePreview = TrimPreview(last?.Content),
                LastMessageAt = last?.SentAt ?? conv.LastMessageAt,
                UnreadCount = unread,
                Participants = conv.Participants.Select(p => ToParticipantDto(p.User)).ToList(),
            };
        }

        private static string? TrimPreview(string? content)
        {
            if (string.IsNullOrEmpty(content)) return null;
            const int MaxPreview = 100;
            if (content.Length <= MaxPreview) return content;
            return content.Substring(0, MaxPreview - 1).TrimEnd() + "…";
        }
    }
}
