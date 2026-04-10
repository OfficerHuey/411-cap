using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Room
{
    //room details returned to the frontend
    public class RoomDto
    {
        public int Id { get; set; }
        public required string RoomNumber { get; set; }
        public required string Building { get; set; }
        public required string Campus { get; set; }
        public int Capacity { get; set; }
        public RoomType Type { get; set; }
    }
}
