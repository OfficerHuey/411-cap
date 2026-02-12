using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Schedule;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                }).ToList()
            });
        }
    }
}