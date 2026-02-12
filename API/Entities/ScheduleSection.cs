using System.ComponentModel.DataAnnotations.Schema;

namespace NursingScheduler.API.Entities
{
    public class ScheduleSection
    {
        public int Id { get; set; }

        //fk to the bucket
        public int ScheduleId { get; set; }
        public Schedule? Schedule { get; set; }

        //fk to the class event
        public int SectionId { get; set; }
        public Section? Section { get; set; }
        
        
    }
}