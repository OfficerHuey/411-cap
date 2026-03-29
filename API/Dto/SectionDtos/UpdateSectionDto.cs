using System;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Section
{
    //used when the user is dragging a block to a new time or editing notes
    public class UpdateSectionDto
    {
        public string? SectionNumber { get; set; }
        public DayOfWeekEnum? DayOfWeek { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public string? Notes { get; set; }
        public string? DateRange { get; set; }

        //term support for semester 4 split courses
        public TermType? Term { get; set; }
        public DateTime? TermStartDate { get; set; }
        public DateTime? TermEndDate { get; set; }

        //optional room assignment
        public int? RoomId { get; set; }
    }
}