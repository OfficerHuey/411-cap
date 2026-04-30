namespace NursingScheduler.API.Services
{
    //options bound from appsettings "FileStorage" section
    public class FileStorageOptions
    {
        public const string SectionName = "FileStorage";

        public string BasePath { get; set; } = "uploads/files";
        public int MaxFileSizeMB { get; set; } = 50;
        public List<string> AllowedExtensions { get; set; } = new()
        {
            ".pdf", ".docx", ".xlsx", ".csv", ".png", ".jpg", ".jpeg", ".txt"
        };

        //convenience: max size in bytes
        public long MaxFileSizeBytes => (long)MaxFileSizeMB * 1024 * 1024;
    }
}
