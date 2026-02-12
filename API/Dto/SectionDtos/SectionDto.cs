using System;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Section
{
    //data that is used to display the block on grid
    public class SectionDto
    {
        public int Id { get; set; }
        public required string SectionNumber { get; set; }
        
        public DayOfWeekEnum? DayOfWeek { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        public string? Notes { get; set; }
        public string? DateRange { get; set; }

        // course info so frontend doesn't have to go look it up
        public int CourseId { get; set; }
        public required string CourseCode { get; set; } //nurs 339"
        public required string CourseName { get; set; } //class name
        public CourseType CourseType { get; set; } //color coding
    }
}