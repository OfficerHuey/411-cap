using System.ComponentModel.DataAnnotations;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Instructor
{
    //data sent when creating a new instructor
    public class CreateInstructorDto
    {
        [Required]
        public required string Name { get; set; }

        public string? Email { get; set; }
        public InstructorType Type { get; set; }
    }
}
