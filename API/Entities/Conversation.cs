namespace NursingScheduler.API.Entities
{
    //in-app messaging — 1:1 dm or n-person group thread
    public class Conversation
    {
        public int Id { get; set; }

        //null for DMs (rendered as the other participant's name), set for groups
        public string? Title { get; set; }
        public bool IsGroupChat { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        //denormalised for cheap sort on the conversation list; updated whenever
        //a message is written to this thread
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        public ICollection<ConversationParticipant> Participants { get; set; }
            = new List<ConversationParticipant>();
        public ICollection<Message> Messages { get; set; }
            = new List<Message>();
    }

    //membership row — one per (conversation, user) pair. LastReadAt drives
    //the unread-count computation (messages newer than this are unread)
    public class ConversationParticipant
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }
        public int UserId { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastReadAt { get; set; }

        public Conversation Conversation { get; set; } = null!;
        public AppUser User { get; set; } = null!;
    }

    //message — content is stored plaintext per the brief. soft-deleted rows
    //keep the audit trail without removing the row
    public class Message
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }
        public int SenderId { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public Conversation Conversation { get; set; } = null!;
        public AppUser Sender { get; set; } = null!;
    }
}
