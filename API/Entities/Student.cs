using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class Student
    {
        public int Id { get; set; }

        //fields for the export
        public required string WNumber { get; set; } //w number
        public required string Name { get; set; }
        public required string Email { get; set; }

        //fk; links the student directly to the bucket.
        // a student is not enrolled in a "course"; they are enrolled in a "schedule".
        //schedule determines which courses they take
        public int ScheduleId { get; set; }
        public Schedule? Schedule { get; set; }
    }
}