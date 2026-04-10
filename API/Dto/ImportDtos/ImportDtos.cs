namespace NursingScheduler.API.DTOs.Import
{
    //parsed student record from the mass enrollment template
    public class ImportedStudentDto
    {
        public string Name { get; set; } = "";
        public string WNumber { get; set; } = "";
        public int SemesterLevel { get; set; }
        public string LocationTag { get; set; } = ""; //"B" or "H"
        public string? ValidationError { get; set; }
        public int RowNumber { get; set; }
    }

    //auto-assignment result for a single student
    public class StudentAssignmentDto
    {
        public ImportedStudentDto Student { get; set; } = new();
        public int ScheduleId { get; set; }
        public string ScheduleName { get; set; } = "";
        public bool RequiresOverride { get; set; }
    }

    //full import preview returned before committing
    public class ImportResultDto
    {
        public int TotalParsed { get; set; }
        public List<StudentAssignmentDto> Assignments { get; set; } = new();
        public List<ImportedStudentDto> Unassigned { get; set; } = new();
        public List<ImportedStudentDto> Errors { get; set; } = new();
    }

    //data sent when committing an import after review
    public class CommitStudentDto
    {
        public required string Name { get; set; }
        public required string WNumber { get; set; }
        public int ScheduleId { get; set; }
        public bool AcknowledgeOverride { get; set; }
        public string? OverrideReason { get; set; }
    }
}
