using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Instructor
{
    //instructor details returned to the frontend
    public class InstructorDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Email { get; set; }
        public InstructorType Type { get; set; }
        //calculated total hours for workload view
        public double TotalWorkloadHours { get; set; }
    }
}
