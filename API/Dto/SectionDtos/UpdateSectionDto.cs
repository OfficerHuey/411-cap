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
    }
}