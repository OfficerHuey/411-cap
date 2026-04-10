using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuditService _auditService;

        public StudentsController(DataContext context, IAuditService auditService)
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

        //add a student manually to a schedule bucket
        [HttpPost]
        public async Task<ActionResult<StudentDto>> AddStudent(CreateStudentDto createDto)
        {
            //check if semester is locked
            var schedule = await _context.Schedules.FindAsync(createDto.ScheduleId);
            if (schedule != null && await IsSemesterLocked(schedule.SemesterId))
                return BadRequest("This semester is locked and cannot be modified");

            //check for duplicate w# in the same semester
            if (schedule != null)
            {
                var duplicate = await _context.Students
                    .Include(s => s.Schedule)
                    .AnyAsync(s => s.WNumber == createDto.WNumber
                                && s.Schedule!.SemesterId == schedule.SemesterId);

                if (duplicate)
                    return BadRequest($"A student with W# {createDto.WNumber} already exists in this semester");
            }

            //check capacity before adding
            var currentCount = await _context.Students.CountAsync(s => s.ScheduleId == createDto.ScheduleId);
            if (schedule != null)
            {
                var cap = schedule.Capacity;

                //absolute hard block at 12+
                if (currentCount >= 12)
                    return Conflict(new
                    {
                        error = "ABSOLUTE_CAP",
                        message = "This schedule is at the absolute maximum (12). No further additions are allowed."
                    });

                //hard block at 10+: no override possible
                if (currentCount >= 10)
                    return Conflict(new
                    {
                        error = "HARD_CAP_EXCEEDED",
                        message = "This schedule is at the hard cap. Create a new section instead.",
                        currentCount,
                        capacity = cap
                    });

                //soft override at 9 (currentCount >= cap and < 10)
                if (currentCount >= cap)
                {
                    //check if override was acknowledged
                    if (!createDto.AcknowledgeOverride)
                    {
                        return Ok(new
                        {
                            requiresOverrideConfirmation = true,
                            message = $"This schedule already has {currentCount} students — Ashley's firm cap is {cap}. Adding a {currentCount + 1}th student is allowed only as an intentional override.",
                            currentCount,
                            capacity = cap
                        });
                    }

                    //override acknowledged — log it
                    var username = User.GetUsername() ?? "unknown";
                    await _auditService.LogChange(
                        "Schedule", schedule.Id, "CapacityOverride", username,
                        $"Override to {currentCount + 1}/{cap}: {createDto.OverrideReason ?? "No reason provided"}",
                        schedule.SemesterId);
                }
            }

            var student = new Student
            {
                Name = createDto.Name,
                WNumber = createDto.WNumber,
                Email = createDto.Email,
                ScheduleId = createDto.ScheduleId
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            var auditUser = User.GetUsername() ?? "unknown";
            await _auditService.LogChange("Student", student.Id, "Created", auditUser, null, schedule?.SemesterId);

            return Ok(new StudentDto
            {
                Id = student.Id,
                Name = student.Name,
                WNumber = student.WNumber,
                Email = student.Email
            });
        }

        //get all students in a schedule bucket
        [HttpGet("schedule/{scheduleId}")]
        public async Task<ActionResult<IEnumerable<StudentDto>>> GetStudentsBySchedule(int scheduleId)
        {
            var students = await _context.Students
                .Where(s => s.ScheduleId == scheduleId)
                .Select(s => new StudentDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    WNumber = s.WNumber,
                    Email = s.Email
                })
                .ToListAsync();

            return Ok(students);
        }

        //get full student detail for the side panel
        [HttpGet("{id}/detail")]
        public async Task<ActionResult> GetStudentDetail(int id)
        {
            var student = await _context.Students
                .Include(s => s.Schedule)
                    .ThenInclude(sch => sch!.Semester)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null) return NotFound();

            //find who added this student from the changelog
            var addedLog = await _context.ChangeLogs
                .Where(c => c.EntityType == "Student" && c.EntityId == id && c.Action == "Created")
                .OrderByDescending(c => c.Timestamp)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                student.Id,
                student.Name,
                student.WNumber,
                student.Email,
                ScheduleId = student.Schedule?.Id,
                ScheduleName = student.Schedule?.Name,
                SemesterLevel = student.Schedule?.SemesterLevel,
                LocationTag = student.Schedule?.LocationDisplay,
                SemesterId = student.Schedule?.Semester?.Id,
                SemesterName = student.Schedule?.Semester?.Name,
                AddedBy = addedLog?.PerformedBy,
                AddedAt = addedLog?.Timestamp
            });
        }

        //delete a student from a schedule
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();

            var username = User.GetUsername() ?? "unknown";
            await _auditService.LogChange("Student", id, "Deleted", username);

            return NoContent();
        }

        //update student info
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateStudent(int id, CreateStudentDto updateDto)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            student.Name = updateDto.Name;
            student.WNumber = updateDto.WNumber;
            student.Email = updateDto.Email;

            await _context.SaveChangesAsync();

            var username = User.GetUsername() ?? "unknown";
            await _auditService.LogChange("Student", student.Id, "Updated", username);

            return NoContent();
        }
    }
}
