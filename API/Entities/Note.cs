using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class Note
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public required string Title { get; set; }

        [Required]
        [MaxLength(4000)]
        public required string Body { get; set; }

        //author fk — the user who created the note
        public int AuthorId { get; set; }
        public AppUser? Author { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        //task-like completion flag
        public bool IsDone { get; set; } = false;

        //polymorphic target — exactly one of these must be set
        public int? SemesterId { get; set; }
        public Semester? Semester { get; set; }

        public int? ScheduleId { get; set; }
        public Schedule? Schedule { get; set; }

        public int? SectionId { get; set; }
        public Section? Section { get; set; }
    }
}
