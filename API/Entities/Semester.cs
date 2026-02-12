using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class Semester
    {
        public int Id { get; set; }

        
        public required string Name { get; set; } //"spring 2026"

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        //stores "thurs/fri" or "tues/wed"
        //for the frontend to know which days to highlight.
        public string? ClinicalDays { get; set; } 

        //navigation properties for the relationships
        //a semester contains many buckets (schedules) and many course sections
        public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
        public ICollection<Section> Sections { get; set; } = new List<Section>();
    }
}