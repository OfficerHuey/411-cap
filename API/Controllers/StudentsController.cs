using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;
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

            var student = new Student
            {
                Name = createDto.Name,
                WNumber = createDto.WNumber,
                Email = createDto.Email,
                ScheduleId = createDto.ScheduleId
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Student", student.Id, "Created", username, null, schedule?.SemesterId);

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

        //delete a student from a schedule
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);
            if (student == null) return NotFound();

            _context.Students.Remove(student);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
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

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Student", student.Id, "Updated", username);

            return NoContent();
        }
    }
}