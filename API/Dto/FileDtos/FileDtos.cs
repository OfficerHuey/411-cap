namespace NursingScheduler.API.DTOs.Files
{
    //metadata DTO returned from all list/get endpoints. omits disk details
    //(StoragePath, internal FileName) that shouldn't leak to the client
    public class AppFileDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string UploadedByName { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public DateTime? LastAccessedAt { get; set; }
    }

    //paged list response
    public class FilesPageResponseDto
    {
        public List<AppFileDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    //partial update payload — title/description only. no file replacement.
    public class UpdateFileDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
    }
}
