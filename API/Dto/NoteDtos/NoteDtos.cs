using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Notes
{
    //read dto — includes author name so frontend doesn't have to fan out
    public class NoteDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Body { get; set; } = "";
        public int AuthorId { get; set; }
        public string AuthorName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsDone { get; set; }
        public int? SemesterId { get; set; }
        public string? SemesterName { get; set; }
        public int? ScheduleId { get; set; }
        public string? ScheduleName { get; set; }
        public int? SectionId { get; set; }
        public string? SectionLabel { get; set; }
    }

    //create dto — authorId comes from jwt, not the request body
    public class CreateNoteDto
    {
        [Required]
        [MaxLength(120)]
        public required string Title { get; set; }

        [Required]
        [MaxLength(4000)]
        public required string Body { get; set; }

        //polymorphic target — exactly one must be set
        public int? SemesterId { get; set; }
        public int? ScheduleId { get; set; }
        public int? SectionId { get; set; }
    }

    //update dto
    public class UpdateNoteDto
    {
        [MaxLength(120)]
        public string? Title { get; set; }

        [MaxLength(4000)]
        public string? Body { get; set; }

        public bool? IsDone { get; set; }
    }
}
