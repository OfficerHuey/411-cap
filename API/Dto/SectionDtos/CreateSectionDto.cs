using System;
using System.ComponentModel.DataAnnotations;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Section
{
    //what's sent when a user drags a bubble onto the calendar
    public class CreateSectionDto
    {
        //user types section number manually
        [Required]
        public required string SectionNumber { get; set; } //"01"

        //nullable because semester 5 (preceptorship) might not have times
        public DayOfWeekEnum? DayOfWeek { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
// used to add details to course like room num or hospital lo
        public string? Notes { get; set; } 
        //handles the "jan 13 - feb 9" requirement for semester 5
         public string? DateRange { get; set; }

        //term support for semester 4 split courses
        public TermType? Term { get; set; }
        public DateTime? TermStartDate { get; set; }
        public DateTime? TermEndDate { get; set; }

        //optional room assignment
        public int? RoomId { get; set; }

        //optional instructor assignment
        public int? InstructorId { get; set; }

        [Required]
        //link to side palette info
        public int CourseId { get; set; }

//link to the parent semester
        [Required]
        public int SemesterId { get; set; }

        // vital link to the bucket we are currently dropping this into
        [Required]
        public int ScheduleId { get; set; }
    }
}