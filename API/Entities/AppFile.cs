namespace NursingScheduler.API.Entities
{
    //centralized file catalog — admins upload reference documents, enrollment
    //templates, etc. stored on local disk, not cloud. soft-deleted to give us
    //an undo path and preserve audit history
    public class AppFile
    {
        public int Id { get; set; }

        //disk filename is guid-prefixed to prevent collisions; original is
        //kept for display + for the download Content-Disposition header
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }

        //admin-editable metadata
        public string? Title { get; set; }
        public string? Description { get; set; }

        //disk path relative to the configured FileStorage:BasePath
        public string StoragePath { get; set; } = string.Empty;

        public int UploadedByUserId { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastAccessedAt { get; set; }

        public bool IsDeleted { get; set; } = false;

        //navigation
        public AppUser UploadedBy { get; set; } = null!;
    }
}
