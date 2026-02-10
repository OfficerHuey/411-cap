using System;
using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Semester
{
    //used when user clicks create new semester on front page
    public class CreateSemesterDto
    {
        [Required]
        public required string Name { get; set; } //spring 2026
        //first day of term
        [Required]
        public DateTime StartDate { get; set; }
//last day of term
        [Required]
        public DateTime EndDate { get; set; }
//toggle for the thurs/fri or tues/wed clinical
        public string? ClinicalDays { get; set; } // Nullable (Optional)
    }
}