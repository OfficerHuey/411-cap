using NursingScheduler.API.Entities; // for Enums

namespace NursingScheduler.API.DTOs.Course
{
    public class CourseDto
    {
        //shows the sidebar palette with information while user is creating schedule
        public int Id { get; set; }
        public required string Code { get; set; } //nurs 339
        public required string Name { get; set; } //class name
        public int SemesterLevel { get; set; }//only shows classes from that level
        public CourseType DefaultType { get; set; } //enum; color codes the type of course
    }
}