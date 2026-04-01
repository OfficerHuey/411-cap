using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Schedule;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SchedulesController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuditService _auditService;

        public SchedulesController(DataContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        //check if semester is locked before allowing changes
        private async Task<bool> IsSemesterLocked(int semesterId)
        {
            var semester = await _context.Semesters.FindAsync(semesterId);
            return semester?.IsLocked ?? false;
        }

        //create a new bucket ("schedule 1")
        [HttpPost]
        public async Task<ActionResult<ScheduleDto>> CreateSchedule(CreateScheduleDto createDto)
        {
            if (await IsSemesterLocked(createDto.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");

            var schedule = new Schedule
            {
                Name = createDto.Name,
                SemesterLevel = createDto.SemesterLevel,
                LocationDisplay = createDto.LocationDisplay,
                Capacity = createDto.Capacity,
                SemesterId = createDto.SemesterId
            };

            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Schedule", schedule.Id, "Created", username, null, schedule.SemesterId);

            return Ok(new ScheduleDto
            {
                Id = schedule.Id,
                Name = schedule.Name,
                SemesterLevel = schedule.SemesterLevel,
                LocationDisplay = schedule.LocationDisplay,
                Capacity = schedule.Capacity,
                SortOrder = schedule.SortOrder,
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
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Instructor)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (schedule == null) return NotFound();

            return Ok(new ScheduleDto
            {
                Id = schedule.Id,
                Name = schedule.Name,
                SemesterLevel = schedule.SemesterLevel,
                LocationDisplay = schedule.LocationDisplay,
                Capacity = schedule.Capacity,
                SortOrder = schedule.SortOrder,
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
                    InstructorId = ss.Section!.InstructorId,
                    InstructorName = ss.Section!.Instructor != null ? ss.Section!.Instructor.Name : null,
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
                .Include(s => s.ScheduleSections)
                    .ThenInclude(ss => ss.Section!)
                        .ThenInclude(sec => sec.Instructor)
                .Where(s => s.SemesterId == semesterId);

            if (level.HasValue)
                query = query.Where(s => s.SemesterLevel == level.Value);

            var schedules = await query.OrderBy(s => s.SortOrder).Select(s => new ScheduleDto
            {
                Id = s.Id,
                Name = s.Name,
                SemesterLevel = s.SemesterLevel,
                LocationDisplay = s.LocationDisplay,
                Capacity = s.Capacity,
                SortOrder = s.SortOrder,
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
                    InstructorId = ss.Section.InstructorId,
                    InstructorName = ss.Section.Instructor != null ? ss.Section.Instructor.Name : null,
                    CourseId = ss.Section.CourseId,
                    CourseCode = ss.Section.Course!.Code,
                    CourseName = ss.Section.Course.Name,
                    CourseType = ss.Section.Course.DefaultType
                }).ToList()
            }).ToListAsync();

            return Ok(schedules);
        }

        //clone a schedule within the same semester
        [HttpPost("clone/{sourceScheduleId}")]
        public async Task<ActionResult<ScheduleDto>> CloneSchedule(int sourceScheduleId, [FromBody] CloneScheduleDto cloneDto)
        {
            var source = await _context.Schedules
                .Include(s => s.ScheduleSections)
                .FirstOrDefaultAsync(s => s.Id == sourceScheduleId);

            if (source == null) return NotFound();
            if (await IsSemesterLocked(source.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");

            var newSchedule = new Schedule
            {
                Name = cloneDto.NewName,
                SemesterLevel = source.SemesterLevel,
                LocationDisplay = cloneDto.NewLocation ?? source.LocationDisplay,
                SemesterId = source.SemesterId,
                Capacity = source.Capacity
            };
            _context.Schedules.Add(newSchedule);
            await _context.SaveChangesAsync();

            //link to the same sections (shared lecture references preserved)
            foreach (var ss in source.ScheduleSections)
            {
                _context.ScheduleSections.Add(new ScheduleSection
                {
                    ScheduleId = newSchedule.Id,
                    SectionId = ss.SectionId
                });
            }
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Schedule", newSchedule.Id, "Cloned", username, $"Cloned from schedule {sourceScheduleId}", source.SemesterId);

            //return the new schedule with full includes
            return await GetSchedule(newSchedule.Id);
        }

        //reorder schedules within a semester level
        [HttpPut("reorder")]
        public async Task<ActionResult> ReorderSchedules([FromBody] List<ReorderDto> items)
        {
            foreach (var item in items)
            {
                var schedule = await _context.Schedules.FindAsync(item.Id);
                if (schedule != null) schedule.SortOrder = item.SortOrder;
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //get capacity status for all schedules in a semester
        [HttpGet("semester/{semesterId}/capacity")]
        public async Task<ActionResult> GetCapacityOverview(int semesterId)
        {
            var schedules = await _context.Schedules
                .Where(s => s.SemesterId == semesterId)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.SemesterLevel,
                    s.LocationDisplay,
                    StudentCount = s.Students.Count,
                    s.Capacity,
                    Status = s.Students.Count < s.Capacity - 1 ? "OK" :
                             s.Students.Count == s.Capacity ? "Full" :
                             s.Students.Count <= s.Capacity + 2 ? "Warning" : "Critical"
                })
                .ToListAsync();

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
            if (await IsSemesterLocked(schedule.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");

            var semesterId = schedule.SemesterId;
            _context.Schedules.Remove(schedule);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Schedule", id, "Deleted", username, null, semesterId);

            return NoContent();
        }

        //update schedule name and location
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSchedule(int id, CreateScheduleDto updateDto)
        {
            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null) return NotFound();
            if (await IsSemesterLocked(schedule.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");

            schedule.Name = updateDto.Name;
            schedule.LocationDisplay = updateDto.LocationDisplay;
            schedule.Capacity = updateDto.Capacity;

            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Schedule", schedule.Id, "Updated", username, null, schedule.SemesterId);

            return NoContent();
        }

        //update only the capacity of a lab group
        [HttpPut("{id}/capacity")]
        public async Task<ActionResult> UpdateCapacity(int id, [FromBody] int capacity)
        {
            var schedule = await _context.Schedules.FindAsync(id);
            if (schedule == null) return NotFound();
            if (await IsSemesterLocked(schedule.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");
            if (capacity < 1) return BadRequest("Capacity must be at least 1");

            schedule.Capacity = capacity;
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Schedule", schedule.Id, "Capacity updated", username, $"New capacity: {capacity}", schedule.SemesterId);

            return Ok(new { schedule.Id, schedule.Capacity });
        }
    }
}

