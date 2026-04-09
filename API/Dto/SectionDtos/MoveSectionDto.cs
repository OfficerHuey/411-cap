using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Section
{
    //used when dragging a placed course block to a new day/time on the calendar
    public class MoveSectionDto
    {
        public DayOfWeekEnum DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int ScheduleId { get; set; }
    }
}
