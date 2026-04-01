namespace NursingScheduler.API.DTOs.Schedule
{
    //used to reorder schedules within a semester level
    public class ReorderDto
    {
        public int Id { get; set; }
        public int SortOrder { get; set; }
    }
}
