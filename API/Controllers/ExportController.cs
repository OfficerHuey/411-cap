using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExportController : ControllerBase
    {
        private readonly DataContext _context;

        public ExportController(DataContext context)
        {
            _context = context;
        }
        //export 1: the roster list
        [HttpGet("roster/{semesterId}")]
        public async Task<IActionResult> ExportRoster(int semesterId)
        {
            var semester = await _context.Semesters
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.Students)
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.ScheduleSections)
                        .ThenInclude(ss => ss.Section)
                            .ThenInclude(sec => sec!.Course)
                .FirstOrDefaultAsync(s => s.Id == semesterId);

            if (semester == null) return NotFound("Semester not found");

            using var workbook = new XLWorkbook();

            foreach (var schedule in semester.Schedules)
            {
                var worksheet = workbook.Worksheets.Add(ValidateSheetName(schedule.Name));

                //headers
                worksheet.Cell(1, 1).Value = "W Number";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Email";

                //map sections
                var sections = schedule.ScheduleSections
                    .Select(ss => ss.Section!)
                    .OrderBy(s => s.Course!.Code)
                    .ToList();

                int colIndex = 4;
                foreach (var section in sections)
                {
                    string header = $"{section.Course!.Code}-{section.SectionNumber}";
                    worksheet.Cell(1, colIndex).Value = header;
                    worksheet.Cell(1, colIndex).Style.Font.Bold = true;
                    worksheet.Cell(1, colIndex).Style.Fill.BackgroundColor = XLColor.LightGray;
                    colIndex++;
                }

                //header styling
                worksheet.Range(1, 1, 1, 3).Style.Font.Bold = true;
                worksheet.Range(1, 1, 1, 3).Style.Fill.BackgroundColor = XLColor.LightBlue;

                //students
                int rowIndex = 2;
                foreach (var student in schedule.Students)
                {
                    worksheet.Cell(rowIndex, 1).Value = student.WNumber;
                    worksheet.Cell(rowIndex, 2).Value = student.Name;
                    worksheet.Cell(rowIndex, 3).Value = student.Email;

                    for (int c = 0; c < sections.Count; c++)
                    {
                        worksheet.Cell(rowIndex, 4 + c).Value = "Enrolled";
                        worksheet.Cell(rowIndex, 4 + c).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    }
                    rowIndex++;
                }
                worksheet.Columns().AdjustToContents();
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{semester.Name}_Student_Rosters.xlsx");
        }
        //export 2: the visual grid
        [HttpGet("grid/{semesterId}")]
        public async Task<IActionResult> ExportScheduleGrids(int semesterId)
        {
            var semester = await _context.Semesters
               .Include(s => s.Schedules)
                   .ThenInclude(sch => sch.ScheduleSections)
                       .ThenInclude(ss => ss.Section)
                           //***fixed line 93 below (added '!') ***
                           .ThenInclude(sec => sec!.Course)
               .FirstOrDefaultAsync(s => s.Id == semesterId);

            if (semester == null) return NotFound("Semester not found");

            using var workbook = new XLWorkbook();

            foreach (var schedule in semester.Schedules)
            {
                var sheet = workbook.Worksheets.Add(ValidateSheetName($"Grid - {schedule.Name}"));

                //draw grid headers
                string[] days = { "Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
                for (int i = 0; i < days.Length; i++)
                {
                    sheet.Cell(1, i + 1).Value = days[i];
                    sheet.Cell(1, i + 1).Style.Font.Bold = true;
                    sheet.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.CornflowerBlue;
                    sheet.Cell(1, i + 1).Style.Font.FontColor = XLColor.White;
                }

                //draw time rows
                int startHour = 7;
                int endHour = 18;
                int currentRow = 2;

                for (int h = startHour; h <= endHour; h++)
                {
                    sheet.Cell(currentRow, 1).Value = $"{h}:00";
                    sheet.Cell(currentRow, 1).Style.Font.Bold = true;
                    currentRow++;
                }

                //draw blocks
                var sections = schedule.ScheduleSections.Select(ss => ss.Section!).ToList();

                foreach (var section in sections)
                {
                    if (section.DayOfWeek == null || section.StartTime == null || section.EndTime == null) continue;

                    int col = (int)section.DayOfWeek + 2;
                    int startRow = (section.StartTime.Value.Hours - startHour) + 2;
                    int durationHours = (section.EndTime.Value.Hours - section.StartTime.Value.Hours);

                    if (durationHours < 1) durationHours = 1;

                    var cell = sheet.Cell(startRow, col);
                    cell.Value = $"{section.Course!.Code}-{section.SectionNumber}\n{section.Notes}";

                    var range = sheet.Range(startRow, col, startRow + durationHours - 1, col);
                    range.Merge();
                    range.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
                    range.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    range.Style.Border.OutsideBorder = XLBorderStyleValues.Thick;

                    if (section.Course.DefaultType == CourseType.Lecture) range.Style.Fill.BackgroundColor = XLColor.LightBlue;
                    else if (section.Course.DefaultType == CourseType.Lab) range.Style.Fill.BackgroundColor = XLColor.LightGreen;
                    else range.Style.Fill.BackgroundColor = XLColor.LightYellow;
                }
                sheet.Columns().AdjustToContents();
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{semester.Name}_Visual_Grids.xlsx");
        }

        private string ValidateSheetName(string name)
        {
            var valid = name.Replace(":", "").Replace("/", "").Replace("?", "").Replace("*", "").Replace("[", "").Replace("]", "");
            return valid.Length > 30 ? valid.Substring(0, 30) : valid;
        }
    }
}