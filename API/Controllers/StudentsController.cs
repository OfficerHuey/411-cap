using Microsoft.AspNetCore.Mvc;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Student;
using NursingScheduler.API.Entities;
using ClosedXML.Excel;

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

        public async void ImportCourses(string filePath)
        {
            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheet(1);

            var headerRow = worksheet.FirstRowUsed();
            var headers = headerRow.Cells()
                .ToDictionary(c => c.GetString(), c => c.Address.ColumnNumber);

            foreach (var row in worksheet.RowsUsed().Skip(1))
            {
                var dto = new CreateStudentDto
                {
                    Name = row.Cell(headers["First Name"]).GetString() + " " +  row.Cell(headers["Last Name"]).GetString(),
                    WNumber = row.Cell(headers["W#"]).GetString(),
                    Email = row.Cell(headers["Email Address"]).GetString()
                };
                await AddStudent(dto);
            }
        }
    }
}