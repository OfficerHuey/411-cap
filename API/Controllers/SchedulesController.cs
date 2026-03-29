using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Schedule;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;
using NursingScheduler.API.DTOs.Section;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SchedulesController : ControllerBase
    {
        private readonly DataContext _context;

        public SchedulesController(DataContext context)
        {
            _context = context;
        }

        //create a new bucket ("schedule 1")
        [HttpPost]
        public async Task<ActionResult<ScheduleDto>> CreateSchedule(CreateScheduleDto createDto)
        {
            var schedule = new Schedule
            {
                Name = createDto.Name,
                SemesterLevel = createDto.SemesterLevel,
                LocationDisplay = createDto.LocationDisplay,
                SemesterId = createDto.SemesterId
            };

            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            return Ok(new ScheduleDto
            {
                Id = schedule.Id,
                Name = schedule.Name,
                SemesterLevel = schedule.SemesterLevel,
                LocationDisplay = schedule.LocationDisplay,
                SemesterId = schedule.SemesterId
            });
        }

        //get a specific schedule and its student roster
        [HttpGet("{id}")]
        public async Task<ActionResult<ScheduleDto>> GetSchedule(int id)
        {
            var schedule = await _context.Schedules
                .Include(s => s.Students)
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Course)
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Room)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schedule == null) return NotFound();

            return Ok(new ScheduleDto
            {
                Id = schedule.Id,
                Name = schedule.Name,
                SemesterLevel = schedule.SemesterLevel,
                LocationDisplay = schedule.LocationDisplay,
                SemesterId = schedule.SemesterId,
                Students = schedule.Students.Select(stu => new StudentDto
                {
                    Id = stu.Id,
                    Name = stu.Name,
                    WNumber = stu.WNumber,
                    Email = stu.Email
                }).ToList(),
                //map the sections
                Sections = schedule.ScheduleSections.Select(ss => new SectionDto
                {
                    Id = ss.Section!.Id,
                    SectionNumber = ss.Section!.SectionNumber,
                    DayOfWeek = ss.Section!.DayOfWeek,
                    StartTime = ss.Section!.StartTime,
                    EndTime = ss.Section!.EndTime,
                    Notes = ss.Section!.Notes,
                    DateRange = ss.Section!.DateRange,
                    Term = ss.Section!.Term,
                    TermStartDate = ss.Section!.TermStartDate,
                    TermEndDate = ss.Section!.TermEndDate,
                    RoomId = ss.Section!.RoomId,
                    RoomNumber = ss.Section!.Room != null ? ss.Section!.Room.RoomNumber : null,
                    RoomBuilding = ss.Section!.Room != null ? ss.Section!.Room.Building : null,
                    CourseId = ss.Section!.CourseId,
                    CourseCode = ss.Section!.Course!.Code,
                    CourseName = ss.Section!.Course!.Name,
                    CourseType = ss.Section!.Course!.DefaultType

                }).ToList()

            });
        }

        //get all schedules for a semester, optionally filtered by level
        [HttpGet("semester/{semesterId}")]
        public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetSchedulesBySemester(int semesterId, [FromQuery] int? level)
        {
            var query = _context.Schedules
                .Include(s => s.Students)
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Course)
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Room)
                .Where(s => s.SemesterId == semesterId);

            if (level.HasValue)
                query = query.Where(s => s.SemesterLevel == level.Value);

            var schedules = await query.Select(s => new ScheduleDto
            {
                Id = s.Id,
                Name = s.Name,
                SemesterLevel = s.SemesterLevel,
                LocationDisplay = s.LocationDisplay,
                SemesterId = s.SemesterId,
                Students = s.Students.Select(stu => new StudentDto
                {
                    Id = stu.Id,
                    Name = stu.Name,
                    WNumber = stu.WNumber,
                    Email = stu.Email
                }).ToList(),
                Sections = s.ScheduleSections.Select(ss => new SectionDto
                {
                    Id = ss.Section!.Id,
                    SectionNumber = ss.Section.SectionNumber,
                    DayOfWeek = ss.Section.DayOfWeek,
                    StartTime = ss.Section.StartTime,
                    EndTime = ss.Section.EndTime,
                    Notes = ss.Section.Notes,
                    DateRange = ss.Section.DateRange,
                    Term = ss.Section.Term,
                    TermStartDate = ss.Section.TermStartDate,
                    TermEndDate = ss.Section.TermEndDate,
                    RoomId = ss.Section.RoomId,
                    RoomNumber = ss.Section.Room != null ? ss.Section.Room.RoomNumber : null,
                    RoomBuilding = ss.Section.Room != null ? ss.Section.Room.Building : null,
                    CourseId = ss.Section.CourseId,
                    CourseCode = ss.Section.Course!.Code,
                    CourseName = ss.Section.Course.Name,
                    CourseType = ss.Section.Course.DefaultType
                }).ToList()
            }).ToListAsync();

            return Ok(schedules);
        }

        //delete a schedule and its links and students
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSchedule(int id)
        {
            var schedule = await _context.Schedules
                .Include(s => s.ScheduleSections)
                .Include(s => s.Students)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schedule == null) return NotFound();

            _context.Schedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //update schedule name and location
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSchedule(int id, CreateScheduleDto updateDto)
        {
            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null) return NotFound();

            schedule.Name = updateDto.Name;
            schedule.LocationDisplay = updateDto.LocationDisplay;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

