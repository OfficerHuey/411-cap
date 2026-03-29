using System.Collections.Generic;

namespace NursingScheduler.API.Entities
{
    public class Room
    {
        public int Id { get; set; }

        //room identifier like "1005" or "BRC-258"
        public required string RoomNumber { get; set; }

        //building name like "KHSA" or "Nursing Building"
        public required string Building { get; set; }

        //campus location like "Hammond" or "Baton Rouge"
        public required string Campus { get; set; }

        //max students the room can hold
        public int Capacity { get; set; }

        //what the room is used for
        public RoomType Type { get; set; }

        //sections assigned to this room
        public ICollection<Section> Sections { get; set; } = new List<Section>();
    }
}
