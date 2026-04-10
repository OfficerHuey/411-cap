using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class Course
    {
        public int Id { get; set; }

       
        //course code
        public required string Code { get; set; } 

        
        //name of course
        public required string Name { get; set; } 
        //when the user clicks semester 1" the api asks where is semester level = 1
        //range is 1-5
        public int SemesterLevel { get; set; }

        //color coding ui feature helper; color for the type of course it is (lecture,lab)
        public CourseType DefaultType { get; set; }

        //credit hours for workload calculation (NURS × 1.0, NLAB × 2.25)
        public int CreditHours { get; set; } = 3;

        //per-course capacity overrides (hospital labs can hold 12 instead of default 8)
        public int DefaultLabCapacity { get; set; } = 8;
        public int DefaultLectureCapacity { get; set; } = 35;

        //a course can show many sections
        public ICollection<Section> Sections { get; set; } = new List<Section>();
    }
}