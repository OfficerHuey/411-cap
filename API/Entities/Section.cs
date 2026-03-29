using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace NursingScheduler.API.Entities
{
    public class Section
    {
        public int Id { get; set; }

        //user types this manually ("01" "02")
        public required string SectionNumber { get; set; }

        //standard schedules for schedules 1-4
        public DayOfWeekEnum? DayOfWeek { get; set; } //nullable for semester 5
        public TimeSpan? StartTime { get; set; }      //nullable for semester 5
        public TimeSpan? EndTime { get; set; }        //nullable for semester 5

        //semester 5 exception
        //if this has text like ("jan 13 - feb 9"), the frontend ignores the 
        // weekly grid and displays this as a "block rotation" instead
        public string? DateRange { get; set; }

        // notes field for classroom location
        public string? Notes { get; set; }

        //term support for semester 4 split courses
        public TermType? Term { get; set; }
        public DateTime? TermStartDate { get; set; }
        public DateTime? TermEndDate { get; set; }

        //optional room assignment
        public int? RoomId { get; set; }
        public Room? Room { get; set; }

        //optional instructor assignment
        public int? InstructorId { get; set; }
        public Instructor? Instructor { get; set; }

        //fk's
        public int CourseId { get; set; }
        public Course? Course { get; set; } // Navigation back to the Palette info

        public int SemesterId { get; set; }
        public Semester? Semester { get; set; }

        //a single section (lecture 01) can be linked to multiple schedules
        public ICollection<ScheduleSection> ScheduleSections { get; set; } = new List<ScheduleSection>();
    }
}