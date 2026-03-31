using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Student
{
    //allows user to manually type user info
    public class CreateStudentDto
    {
        [Required]
        [MinLength(2)]
        public required string Name { get; set; }

        [Required]
        [RegularExpression(@"^\d{7}$", ErrorMessage = "W# must be exactly 7 digits")]
        public required string WNumber { get; set; }

        [Required]
        [EmailAddress]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@selu\.edu$", ErrorMessage = "Email must be @selu.edu")]
        public required string Email { get; set; }

        //links student directly to the schedule bucket
        [Required]
        public int ScheduleId { get; set; }
    }
}