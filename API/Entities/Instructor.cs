using System.Collections.Generic;

namespace NursingScheduler.API.Entities
{
    public class Instructor
    {
        public int Id { get; set; }

        //instructor display name
        public required string Name { get; set; }

        //contact email
        public string? Email { get; set; }

        //employment type for workload tracking
        public InstructorType Type { get; set; }

        //contact phone number (optional, free-form)
        public string? Phone { get; set; }

        //sections this instructor is assigned to (via simple FK on section)
        public ICollection<Section> Sections { get; set; } = new List<Section>();

        //join table for workload tracking and multi-instructor support
        public ICollection<SectionInstructor> SectionInstructors { get; set; } = new List<SectionInstructor>();
    }
}
