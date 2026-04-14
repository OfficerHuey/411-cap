using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Schedule
{
    //used to create a new bucket of students
    public class CreateScheduleDto
    {
        [Required]
        //"schedule 1"
        public required string Name { get; set; }

        [Required]
        [Range(1, 5)]
        //ensures this bucket only sees courses for its level
        public int SemesterLevel { get; set; } 

        //optional custom label like "hammond - room 302"
        public string? LocationDisplay { get; set; }

        //max students for this lab group, defaults to 8 if not specified
        public int Capacity { get; set; } = 8;

        [Required]
        //links this bucket to the main semester folder
        public int SemesterId { get; set; }
    }
}