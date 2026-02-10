using System.Collections.Generic;
using NursingScheduler.API.DTOs.Student; // Need to reference Student DTOs

namespace NursingScheduler.API.DTOs.Schedule
{
    //main view when user opens a folder
    public class ScheduleDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int SemesterLevel { get; set; }
        public string? LocationDisplay { get; set; }
        public int SemesterId { get; set; }

        //list of students inside specific bucket
        public List<StudentDto> Students { get; set; } = new();
    }
}