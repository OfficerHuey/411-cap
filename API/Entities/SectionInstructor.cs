namespace NursingScheduler.API.Entities
{
    //join entity connecting sections to instructors
    //supports multiple instructors per section and workload overrides
    public class SectionInstructor
    {
        public int Id { get; set; }

        public int SectionId { get; set; }
        public Section Section { get; set; } = null!;

        public int InstructorId { get; set; }
        public Instructor Instructor { get; set; } = null!;

        //manual override of calculated workload for split-course scenarios
        public decimal? WorkloadOverride { get; set; }
        public string? WorkloadOverrideReason { get; set; }
    }
}
