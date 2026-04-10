using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Schedule
{
    //data sent when cloning a schedule as a template
    public class CloneScheduleDto
    {
        [Required]
        public required string NewName { get; set; }
        public string? NewLocation { get; set; }
    }
}
