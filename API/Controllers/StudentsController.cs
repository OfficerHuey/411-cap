using Microsoft.AspNetCore.Mvc;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
    }
}