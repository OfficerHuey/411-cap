using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Student
{
    //allows user to manually type user info
    public class CreateStudentDto
    {
        [Required]
        public required string Name { get; set; }

        [Required]
        public required string WNumber { get; set; }

        [Required]
        [EmailAddress]
        public required string Email { get; set; }

//links student directly to the schedule bucket
        [Required]
        public int ScheduleId { get; set; }
    }
}