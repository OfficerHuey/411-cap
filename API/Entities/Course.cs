using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class Course
    {
        public int Id { get; set; }

        [Required]
        //course code
        public string Code { get; set; } 

        [Required]
        //name of course
        public string Name { get; set; } 
        //when the user clicks semester 1" the api asks where is semester level = 1
        //range is 1-5
        public int SemesterLevel { get; set; }

        //color coding ui feature helper; color for the type of course it is (lecture,lab)
        public CourseType DefaultType { get; set; }

        //a course can show many sections
        public ICollection<Section> Sections { get; set; }
    }
}