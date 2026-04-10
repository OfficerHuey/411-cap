namespace NursingScheduler.API.DTOs.Instructor
{
    public class InstructorWorkloadDto
    {
        public int InstructorId { get; set; }
        public string InstructorName { get; set; } = "";
        public int SemesterId { get; set; }
        public decimal TotalWorkload { get; set; }
        public List<SectionWorkloadDto> Sections { get; set; } = new();
    }

    public class SectionWorkloadDto
    {
        public int SectionId { get; set; }
        public string CourseCode { get; set; } = "";
        public string SectionNumber { get; set; } = "";
        public decimal CalculatedWorkload { get; set; }
        public decimal? OverrideWorkload { get; set; }
        public decimal AppliedWorkload { get; set; }
        public bool IsOverridden { get; set; }
    }

    //body for setting a workload override
    public class SetWorkloadOverrideDto
    {
        public decimal? WorkloadOverride { get; set; }
        public string? Reason { get; set; }
    }
}
