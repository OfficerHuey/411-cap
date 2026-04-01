using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Import;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ImportController : ControllerBase
    {
        private readonly DataContext _context;

        public ImportController(DataContext context) => _context = context;

        //upload csv/xlsx and preview auto-assignments without committing
        [HttpPost("students/{semesterId}")]
        public async Task<ActionResult<ImportResultDto>> ImportStudents(int semesterId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".csv" && extension != ".xlsx")
                return BadRequest("Only .csv and .xlsx files are supported");

            //parse the file into student records
            var students = extension == ".csv"
                ? await ParseCsv(file)
                : await ParseXlsx(file);

            if (students.Count == 0)
                return BadRequest("No valid student records found in file");

            //get available schedule groups for this semester
            var schedules = await _context.Schedules
                .Include(s => s.Students)
                .Where(s => s.SemesterId == semesterId)
                .ToListAsync();

            //auto-assign logic
            var assignments = new List<StudentAssignmentDto>();
            var unassigned = new List<ImportedStudentDto>();

            foreach (var student in students)
            {
                var assigned = false;

                //try 1st choice location match
                var firstChoice = schedules
                    .Where(s => s.LocationDisplay != null &&
                           s.LocationDisplay.Contains(student.PreferredLocation ?? "", StringComparison.OrdinalIgnoreCase))
                    .Where(s => s.Students.Count < s.Capacity)
                    .OrderBy(s => s.Students.Count)
                    .FirstOrDefault();

                if (firstChoice != null)
                {
                    assignments.Add(new StudentAssignmentDto
                    {
                        Student = student,
                        ScheduleId = firstChoice.Id,
                        ScheduleName = firstChoice.Name,
                        MatchType = "1st Choice"
                    });
                    assigned = true;
                }

                if (!assigned)
                {
                    //try any schedule with capacity
                    var fallback = schedules
                        .Where(s => s.Students.Count < s.Capacity)
                        .OrderBy(s => s.Students.Count)
                        .FirstOrDefault();

                    if (fallback != null)
                    {
                        assignments.Add(new StudentAssignmentDto
                        {
                            Student = student,
                            ScheduleId = fallback.Id,
                            ScheduleName = fallback.Name,
                            MatchType = "Auto-assigned (no preference match)"
                        });
                    }
                    else
                    {
                        unassigned.Add(student);
                    }
                }
            }

            //return preview without committing
            return Ok(new ImportResultDto
            {
                TotalParsed = students.Count,
                Assignments = assignments,
                Unassigned = unassigned
            });
        }

        //commit the assignments after admin review
        [HttpPost("students/commit")]
        public async Task<ActionResult> CommitImport([FromBody] List<CommitStudentDto> assignments)
        {
            foreach (var assignment in assignments)
            {
                var student = new Student
                {
                    Name = assignment.Name,
                    WNumber = assignment.WNumber,
                    Email = assignment.Email,
                    ScheduleId = assignment.ScheduleId
                };
                _context.Students.Add(student);
            }
            await _context.SaveChangesAsync();
            return Ok(new { Committed = assignments.Count });
        }

        //parse csv file into student records
        private async Task<List<ImportedStudentDto>> ParseCsv(IFormFile file)
        {
            var result = new List<ImportedStudentDto>();
            using var reader = new StreamReader(file.OpenReadStream());

            var header = await reader.ReadLineAsync();
            while (await reader.ReadLineAsync() is { } line)
            {
                var parts = line.Split(',').Select(p => p.Trim('"', ' ')).ToArray();
                if (parts.Length < 4) continue;

                result.Add(new ImportedStudentDto
                {
                    Name = $"{parts[0]} {parts[1]}".Trim(),
                    WNumber = parts.Length > 2 ? parts[2] : "",
                    Email = parts.Length > 3 ? parts[3] : "",
                    PreferredLocation = parts.Length > 4 ? parts[4] : null,
                    FirstChoice = parts.Length > 6 ? parts[6] : null,
                    SecondChoice = parts.Length > 7 ? parts[7] : null,
                    EmployedAt = parts.Length > 8 ? parts[8] : null
                });
            }
            return result;
        }

        //parse xlsx file into student records using closedxml
        private async Task<List<ImportedStudentDto>> ParseXlsx(IFormFile file)
        {
            var result = new List<ImportedStudentDto>();
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
            var worksheet = workbook.Worksheets.First();

            var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
            for (int row = 2; row <= rowCount; row++)
            {
                var firstName = worksheet.Cell(row, 1).GetString();
                var lastName = worksheet.Cell(row, 2).GetString();
                if (string.IsNullOrWhiteSpace(firstName) && string.IsNullOrWhiteSpace(lastName)) continue;

                result.Add(new ImportedStudentDto
                {
                    Name = $"{firstName} {lastName}".Trim(),
                    WNumber = worksheet.Cell(row, 3).GetString(),
                    Email = worksheet.Cell(row, 4).GetString(),
                    PreferredLocation = worksheet.Cell(row, 5).GetString(),
                    FirstChoice = worksheet.Cell(row, 7).GetString(),
                    SecondChoice = worksheet.Cell(row, 8).GetString(),
                    EmployedAt = worksheet.Cell(row, 9).GetString()
                });
            }
            return result;
        }
    }
}
