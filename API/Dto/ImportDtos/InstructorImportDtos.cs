namespace NursingScheduler.API.DTOs.Import
{
    //parsed instructor record from the import template
    public class ImportedInstructorDto
    {
        public string Name { get; set; } = "";
        public string? Email { get; set; }
        public string Type { get; set; } = "";
        public string? Phone { get; set; }
        public string? ValidationError { get; set; }
        public int RowNumber { get; set; }
    }

    //full import preview returned before committing
    public class InstructorImportResultDto
    {
        public int TotalParsed { get; set; }
        public List<ImportedInstructorDto> Valid { get; set; } = new();
        public List<ImportRowError> Errors { get; set; } = new();
    }

    //per-row validation error
    public class ImportRowError
    {
        public int Row { get; set; }
        public string Field { get; set; } = "";
        public string Message { get; set; } = "";
    }

    //data sent when committing instructor import
    public class CommitInstructorDto
    {
        public required string Name { get; set; }
        public string? Email { get; set; }
        public required string Type { get; set; }
        public string? Phone { get; set; }
    }
}
