using System;

namespace NursingScheduler.API.Entities
{
    //tracks who changed what and when
    public class ChangeLog
    {
        public int Id { get; set; }

        //entity being modified (section, student, schedule)
        public required string EntityType { get; set; }

        //id of the modified entity
        public int EntityId { get; set; }

        //what happened (created, updated, deleted)
        public required string Action { get; set; }

        //json string of before/after values
        public string? Changes { get; set; }

        //username from jwt who performed the action
        public required string PerformedBy { get; set; }

        //when the change occurred
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        //for filtering by semester
        public int? SemesterId { get; set; }
    }
}
