using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly DataContext _context;

        public StudentsController(DataContext context)
        {
            _context = context;
        }

        //add a student manually to a schedule bucket
        [HttpPost]
        public async Task<ActionResult<StudentDto>> AddStudent(CreateStudentDto createDto)
        {
            var student = new Student
            {
                Name = createDto.Name,
                WNumber = createDto.WNumber,
                Email = createDto.Email,
                ScheduleId = createDto.ScheduleId
            };

            _context.Students.Add(student);
            await _context.SaveChangesAsync();

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
            return NoContent();
        }
    }
}