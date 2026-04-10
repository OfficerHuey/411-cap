using System.ComponentModel.DataAnnotations;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.DTOs.Room
{
    //data sent when creating a new room
    public class CreateRoomDto
    {
        [Required]
        public required string RoomNumber { get; set; }

        [Required]
        public required string Building { get; set; }

        [Required]
        public required string Campus { get; set; }

        public int Capacity { get; set; }
        public RoomType Type { get; set; }
    }
}
