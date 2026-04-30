namespace NursingScheduler.API.DTOs.Messages
{
    //participant summary — avatar + role shown in the thread header and
    //the conversation list cards
    public class ConversationParticipantDto
    {
        public int UserId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    //one row in the conversation list. the frontend renders DMs as the
    //other participant's name when Title is null
    public class ConversationDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public bool IsGroupChat { get; set; }
        public string? LastMessagePreview { get; set; }
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public List<ConversationParticipantDto> Participants { get; set; } = new();
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string SenderInitials { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
    }

    //paged message listing — newest last so the client can appendNodes()
    public class MessagesPageDto
    {
        public List<MessageDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class SendMessageDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class CreateConversationDto
    {
        public List<int> ParticipantUserIds { get; set; } = new();
        public string? Title { get; set; }
        public string? InitialMessage { get; set; }
    }

    public class UnreadCountDto
    {
        public int Count { get; set; }
    }

    //flat user directory row for the "new conversation" picker
    public class AvailableUserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
