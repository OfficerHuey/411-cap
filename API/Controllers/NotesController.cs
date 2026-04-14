using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Notes;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotesController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuditService _auditService;

        public NotesController(DataContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        //resolve the current user's id from jwt username claim
        private async Task<int> GetCurrentUserId()
        {
            var username = User.GetUsername() ?? "";
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == username);
            return user?.Id ?? 0;
        }

        //get filtered notes list, newest first
        [HttpGet]
        public async Task<ActionResult<List<NoteDto>>> GetNotes(
            [FromQuery] int? semesterId,
            [FromQuery] int? scheduleId,
            [FromQuery] int? sectionId,
            [FromQuery] string? status,
            [FromQuery] string? author)
        {
            var query = _context.Notes
                .Include(n => n.Author)
                .Include(n => n.Semester)
                .Include(n => n.Schedule)
                .Include(n => n.Section)
                .AsQueryable();

            if (semesterId.HasValue)
                query = query.Where(n => n.SemesterId == semesterId.Value);
            if (scheduleId.HasValue)
                query = query.Where(n => n.ScheduleId == scheduleId.Value);
            if (sectionId.HasValue)
                query = query.Where(n => n.SectionId == sectionId.Value);

            if (status == "open")
                query = query.Where(n => !n.IsDone);
            else if (status == "done")
                query = query.Where(n => n.IsDone);

            if (!string.IsNullOrEmpty(author))
                query = query.Where(n => n.Author != null && n.Author.UserName == author);

            var notes = await query
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => MapToDto(n))
                .ToListAsync();

            return Ok(notes);
        }

        //get single note
        [HttpGet("{id}")]
        public async Task<ActionResult<NoteDto>> GetNote(int id)
        {
            var note = await _context.Notes
                .Include(n => n.Author)
                .Include(n => n.Semester)
                .Include(n => n.Schedule)
                .Include(n => n.Section)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (note == null) return NotFound();
            return Ok(MapToDto(note));
        }

        //create a note
        [HttpPost]
        public async Task<ActionResult<NoteDto>> CreateNote(CreateNoteDto dto)
        {
            //enforce exactly one target fk
            var targets = new[] { dto.SemesterId.HasValue, dto.ScheduleId.HasValue, dto.SectionId.HasValue };
            if (targets.Count(t => t) != 1)
                return BadRequest("Exactly one of SemesterId, ScheduleId, or SectionId must be set");

            var authorId = await GetCurrentUserId();
            if (authorId == 0)
                return Unauthorized("Could not resolve user");

            var note = new Note
            {
                Title = dto.Title,
                Body = dto.Body,
                AuthorId = authorId,
                SemesterId = dto.SemesterId,
                ScheduleId = dto.ScheduleId,
                SectionId = dto.SectionId,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            await _auditService.LogChange("Note", note.Id, "Created", User.GetUsername() ?? "unknown");

            //reload with includes for the response
            var created = await _context.Notes
                .Include(n => n.Author)
                .Include(n => n.Semester)
                .Include(n => n.Schedule)
                .Include(n => n.Section)
                .FirstAsync(n => n.Id == note.Id);

            return CreatedAtAction(nameof(GetNote), new { id = note.Id }, MapToDto(created));
        }

        //update a note — only author or admin
        [HttpPut("{id}")]
        public async Task<ActionResult<NoteDto>> UpdateNote(int id, UpdateNoteDto dto)
        {
            var note = await _context.Notes
                .Include(n => n.Author)
                .Include(n => n.Semester)
                .Include(n => n.Schedule)
                .Include(n => n.Section)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (note == null) return NotFound();

            //check ownership
            var currentUserId = await GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");
            if (note.AuthorId != currentUserId && !isAdmin)
                return Forbid();

            if (dto.Title != null) note.Title = dto.Title;
            if (dto.Body != null) note.Body = dto.Body;
            if (dto.IsDone.HasValue) note.IsDone = dto.IsDone.Value;
            note.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _auditService.LogChange("Note", note.Id, "Updated", User.GetUsername() ?? "unknown");

            return Ok(MapToDto(note));
        }

        //delete a note — only author or admin
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteNote(int id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return NotFound();

            var currentUserId = await GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");
            if (note.AuthorId != currentUserId && !isAdmin)
                return Forbid();

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
            await _auditService.LogChange("Note", id, "Deleted", User.GetUsername() ?? "unknown");

            return NoContent();
        }

        //get list of all users for the author filter dropdown
        [HttpGet("authors")]
        public async Task<ActionResult> GetAuthors()
        {
            var authors = await _context.Notes
                .Include(n => n.Author)
                .Where(n => n.Author != null)
                .Select(n => new { n.Author!.Id, Name = n.Author.UserName })
                .Distinct()
                .ToListAsync();

            return Ok(authors);
        }

        //map entity to dto
        private static NoteDto MapToDto(Note n) => new()
        {
            Id = n.Id,
            Title = n.Title,
            Body = n.Body,
            AuthorId = n.AuthorId,
            AuthorName = n.Author?.UserName ?? "Unknown",
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt,
            IsDone = n.IsDone,
            SemesterId = n.SemesterId,
            SemesterName = n.Semester?.Name,
            ScheduleId = n.ScheduleId,
            ScheduleName = n.Schedule?.Name,
            SectionId = n.SectionId,
            SectionLabel = n.Section != null ? $"{n.Section.SectionNumber}" : null,
        };
    }
}
