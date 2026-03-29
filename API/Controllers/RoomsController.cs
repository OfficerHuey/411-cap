using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Room;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly DataContext _context;

        public RoomsController(DataContext context)
        {
            _context = context;
        }

        //get all rooms, optionally filtered by campus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetRooms([FromQuery] string? campus)
        {
            var query = _context.Rooms.AsQueryable();

            if (!string.IsNullOrEmpty(campus))
                query = query.Where(r => r.Campus == campus);

            var rooms = await query.Select(r => new RoomDto
            {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                Building = r.Building,
                Campus = r.Campus,
                Capacity = r.Capacity,
                Type = r.Type
            }).ToListAsync();

            return Ok(rooms);
        }

        //get a single room by id
        [HttpGet("{id}")]
        public async Task<ActionResult<RoomDto>> GetRoom(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            return Ok(new RoomDto
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                Building = room.Building,
                Campus = room.Campus,
                Capacity = room.Capacity,
                Type = room.Type
            });
        }

        //create a new room
        [HttpPost]
        public async Task<ActionResult<RoomDto>> CreateRoom(CreateRoomDto createDto)
        {
            var room = new Room
            {
                RoomNumber = createDto.RoomNumber,
                Building = createDto.Building,
                Campus = createDto.Campus,
                Capacity = createDto.Capacity,
                Type = createDto.Type
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return Ok(new RoomDto
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                Building = room.Building,
                Campus = room.Campus,
                Capacity = room.Capacity,
                Type = room.Type
            });
        }

        //update room details
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateRoom(int id, CreateRoomDto updateDto)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            room.RoomNumber = updateDto.RoomNumber;
            room.Building = updateDto.Building;
            room.Campus = updateDto.Campus;
            room.Capacity = updateDto.Capacity;
            room.Type = updateDto.Type;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        //delete a room
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRoom(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound();

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //get all sections assigned to a room in a semester
        [HttpGet("{id}/sections")]
        public async Task<ActionResult<IEnumerable<SectionDto>>> GetRoomSections(int id, [FromQuery] int semesterId)
        {
            var sections = await _context.Sections
                .Include(s => s.Course)
                .Where(s => s.RoomId == id && s.SemesterId == semesterId)
                .Select(s => new SectionDto
                {
                    Id = s.Id,
                    SectionNumber = s.SectionNumber,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Notes = s.Notes,
                    DateRange = s.DateRange,
                    Term = s.Term,
                    TermStartDate = s.TermStartDate,
                    TermEndDate = s.TermEndDate,
                    RoomId = s.RoomId,
                    CourseId = s.CourseId,
                    CourseCode = s.Course!.Code,
                    CourseName = s.Course.Name,
                    CourseType = s.Course.DefaultType
                })
                .ToListAsync();

            return Ok(sections);
        }
    }
}
