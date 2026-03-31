using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace NursingScheduler.API.Entities
{
    public class Schedule
    {
        public int Id { get; set; }
//schedule label
        public required string Name { get; set; } 

        //keeps the freshman and senior courses seperate
        public int SemesterLevel { get; set; } 

        //a place to name the location for the whole group
        public string? LocationDisplay { get; set; }

        //max students allowed in this lab group, editable after creation
        public int Capacity { get; set; } = 8;

        //fk; defines what semester the bucket belongs to
        public int SemesterId { get; set; }
        public Semester? Semester { get; set; }

        //students inside this bucket
        public ICollection<Student> Students { get; set; } = new List<Student>();

        //link to the Sections
        //using a collection of ScheduleSections instead of sections directly 
        public ICollection<ScheduleSection> ScheduleSections { get; set; }= new List<ScheduleSection>();
    }
}