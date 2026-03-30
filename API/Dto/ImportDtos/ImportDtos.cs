namespace NursingScheduler.API.DTOs.Import
{
    //parsed student record from csv/xlsx file
    public class ImportedStudentDto
    {
        public string Name { get; set; } = "";
        public string WNumber { get; set; } = "";
        public string Email { get; set; } = "";
        public string? PreferredLocation { get; set; }
        public string? FirstChoice { get; set; }
        public string? SecondChoice { get; set; }
        public string? EmployedAt { get; set; }
    }

    //auto-assignment result for a single student
    public class StudentAssignmentDto
    {
        public ImportedStudentDto Student { get; set; } = new();
        public int ScheduleId { get; set; }
        public string ScheduleName { get; set; } = "";
        public string MatchType { get; set; } = "";
    }

    //full import preview returned before committing
    public class ImportResultDto
    {
        public int TotalParsed { get; set; }
        public List<StudentAssignmentDto> Assignments { get; set; } = new();
        public List<ImportedStudentDto> Unassigned { get; set; } = new();
    }

    //data sent when committing an import after review
    public class CommitStudentDto
    {
        public required string Name { get; set; }
        public required string WNumber { get; set; }
        public required string Email { get; set; }
        public int ScheduleId { get; set; }
    }
}
