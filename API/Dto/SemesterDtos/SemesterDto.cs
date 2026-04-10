using System;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Semester
{
    //this is the full semester object sent to the frontend to display the list
    public class SemesterDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ClinicalDays { get; set; }
        public bool IsLocked { get; set; }
        public bool IsAnchorTemplate { get; set; }
        public ClinicalDayRotation? AnchorRotation { get; set; }
    }
}