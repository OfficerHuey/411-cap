using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Import;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ImportController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuditService _auditService;
        private static readonly Regex WNumberRegex = new(@"^[Ww]\d{7}$", RegexOptions.Compiled);
        private static readonly HashSet<string> ValidTags = new(StringComparer.OrdinalIgnoreCase) { "B", "H" };
        private static readonly HashSet<string> ValidInstructorTypes = new(StringComparer.OrdinalIgnoreCase) { "FullTime", "Adjunct", "Overload" };
        private static readonly HashSet<string> ValidCampuses = new(StringComparer.OrdinalIgnoreCase) { "Hammond", "BatonRouge", "StTammany" };
        private static readonly HashSet<string> ValidRoomTypes = new(StringComparer.OrdinalIgnoreCase) { "Lecture", "Lab", "SimLab", "Clinical", "Online", "Classroom", "Conference" };

        public ImportController(DataContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

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

            //validate parsed records
            var valid = new List<ImportedStudentDto>();
            var errors = new List<ImportedStudentDto>();

            //check for duplicate w# within the upload
            var seenWNumbers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            //check for existing w# in this semester
            var existingWNumbers = await _context.Students
                .Include(s => s.Schedule)
                .Where(s => s.Schedule!.SemesterId == semesterId)
                .Select(s => s.WNumber.ToUpper())
                .ToListAsync();
            var existingSet = existingWNumbers.ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var student in students)
            {
                //w# validation
                if (!WNumberRegex.IsMatch(student.WNumber))
                {
                    student.ValidationError = $"Invalid W#: '{student.WNumber}' — must match W followed by 7 digits";
                    errors.Add(student);
                    continue;
                }

                //location tag validation
                if (!ValidTags.Contains(student.LocationTag))
                {
                    student.ValidationError = $"Invalid Location Tag: '{student.LocationTag}' — must be B or H";
                    errors.Add(student);
                    continue;
                }

                //semester level validation
                if (student.SemesterLevel < 1 || student.SemesterLevel > 5)
                {
                    student.ValidationError = $"Invalid Semester: must be 1-5";
                    errors.Add(student);
                    continue;
                }

                //normalize w# to uppercase
                student.WNumber = student.WNumber.ToUpper();

                //duplicate within upload
                if (!seenWNumbers.Add(student.WNumber))
                {
                    student.ValidationError = $"Duplicate W# within this upload: {student.WNumber}";
                    errors.Add(student);
                    continue;
                }

                //duplicate against existing students in this semester
                if (existingSet.Contains(student.WNumber))
                {
                    student.ValidationError = $"Student {student.WNumber} already exists in this semester";
                    errors.Add(student);
                    continue;
                }

                valid.Add(student);
            }

            //get available schedule groups for this semester, ordered by sort order
            var schedules = await _context.Schedules
                .Include(s => s.Students)
                .Where(s => s.SemesterId == semesterId)
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

            //auto-assign: group schedules by (semesterLevel, locationTag)
            var assignments = new List<StudentAssignmentDto>();
            var unassigned = new List<ImportedStudentDto>();

            //track how many we're assigning per schedule during preview
            var previewAdded = new Dictionary<int, int>();

            foreach (var student in valid)
            {
                //map location tag to location display keywords
                var locationKeyword = student.LocationTag.ToUpper() == "B" ? "Baton Rouge" : "Hammond";

                //find matching schedules: same semester level and location
                var matchingSchedules = schedules
                    .Where(s => s.SemesterLevel == student.SemesterLevel)
                    .Where(s => s.LocationDisplay != null &&
                           s.LocationDisplay.Contains(locationKeyword, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(s => s.SortOrder)
                    .ToList();

                var assigned = false;

                foreach (var schedule in matchingSchedules)
                {
                    previewAdded.TryGetValue(schedule.Id, out var alreadyAdded);
                    var currentCount = schedule.Students.Count + alreadyAdded;
                    var cap = schedule.Capacity;

                    //hard block at 10+
                    if (currentCount >= 10)
                        continue;

                    //absolute hard block at 12
                    if (currentCount >= 12)
                        continue;

                    var requiresOverride = currentCount >= cap && currentCount < 10;

                    assignments.Add(new StudentAssignmentDto
                    {
                        Student = student,
                        ScheduleId = schedule.Id,
                        ScheduleName = schedule.Name,
                        RequiresOverride = requiresOverride
                    });

                    previewAdded[schedule.Id] = alreadyAdded + 1;
                    assigned = true;
                    break;
                }

                if (!assigned)
                    unassigned.Add(student);
            }

            return Ok(new ImportResultDto
            {
                TotalParsed = students.Count,
                Assignments = assignments,
                Unassigned = unassigned,
                Errors = errors
            });
        }

        //commit the assignments after admin review
        [HttpPost("students/commit")]
        public async Task<ActionResult> CommitImport([FromBody] List<CommitStudentDto> assignments)
        {
            var username = User.GetUsername() ?? "unknown";

            //pre-load schedule capacities and current counts
            var scheduleIds = assignments.Select(a => a.ScheduleId).Distinct().ToList();
            var schedules = await _context.Schedules
                .Include(s => s.Students)
                .Where(s => scheduleIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id);

            //track how many we're adding per schedule during this commit
            var addedPerSchedule = new Dictionary<int, int>();
            var rejected = new List<object>();
            var committed = 0;

            foreach (var assignment in assignments)
            {
                if (!schedules.TryGetValue(assignment.ScheduleId, out var schedule))
                {
                    rejected.Add(new { assignment.WNumber, reason = "Schedule not found" });
                    continue;
                }

                addedPerSchedule.TryGetValue(assignment.ScheduleId, out var alreadyAdded);
                var currentCount = schedule.Students.Count + alreadyAdded;
                var cap = schedule.Capacity;

                //absolute hard block at 12
                if (currentCount >= 12)
                {
                    rejected.Add(new { assignment.WNumber, reason = $"Schedule \"{schedule.Name}\" is at absolute hard cap (12)" });
                    continue;
                }

                //hard block at 10+
                if (currentCount >= 10)
                {
                    rejected.Add(new { assignment.WNumber, reason = $"Schedule \"{schedule.Name}\" is at hard cap ({currentCount}). Create a new section instead." });
                    continue;
                }

                //soft override at 9 (currentCount >= cap and < 10)
                if (currentCount >= cap)
                {
                    if (!assignment.AcknowledgeOverride)
                    {
                        rejected.Add(new { assignment.WNumber, reason = "REQUIRES_OVERRIDE", requiresOverrideConfirmation = true, scheduleName = schedule.Name, currentCount });
                        continue;
                    }

                    //log the override
                    await _auditService.LogChange(
                        "Schedule", schedule.Id, "CapacityOverride", username,
                        $"Override to {currentCount + 1}/{cap}: {assignment.OverrideReason ?? "No reason provided"}",
                        schedule.SemesterId);
                }

                //normalize w#
                var wNumber = assignment.WNumber.ToUpper();

                var student = new Student
                {
                    Name = assignment.Name,
                    WNumber = wNumber,
                    Email = $"{wNumber.ToLower()}@selu.edu",
                    ScheduleId = assignment.ScheduleId
                };
                _context.Students.Add(student);
                addedPerSchedule[assignment.ScheduleId] = alreadyAdded + 1;
                committed++;
            }

            await _context.SaveChangesAsync();

            //log import action
            if (committed > 0)
            {
                await _auditService.LogChange("Student", 0, "BulkImport", username,
                    $"Imported {committed} students via mass enrollment template");
            }

            return Ok(new { Committed = committed, Rejected = rejected });
        }

        //download xlsx template for mass enrollment
        [HttpGet("students/template")]
        public IActionResult DownloadTemplate()
        {
            using var workbook = new ClosedXML.Excel.XLWorkbook();

            //data sheet
            var ws = workbook.Worksheets.Add("Students");
            ws.Cell(1, 1).Value = "Student Name";
            ws.Cell(1, 2).Value = "W#";
            ws.Cell(1, 3).Value = "Semester";
            ws.Cell(1, 4).Value = "Location Tag";

            //style header
            var headerRange = ws.Range(1, 1, 1, 4);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#00563F");
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;

            //example rows
            ws.Cell(2, 1).Value = "Jane Doe";
            ws.Cell(2, 2).Value = "W0715502";
            ws.Cell(2, 3).Value = "1";
            ws.Cell(2, 4).Value = "H";

            ws.Cell(3, 1).Value = "John Smith";
            ws.Cell(3, 2).Value = "W0823901";
            ws.Cell(3, 3).Value = "2";
            ws.Cell(3, 4).Value = "B";

            ws.Cell(4, 1).Value = "Maria Garcia";
            ws.Cell(4, 2).Value = "W0934102";
            ws.Cell(4, 3).Value = "Semester 3";
            ws.Cell(4, 4).Value = "H";

            ws.Columns().AdjustToContents();

            //instructions sheet
            var instrWs = workbook.Worksheets.Add("Instructions");
            instrWs.Cell(1, 1).Value = "Mass Enrollment Template — Instructions";
            instrWs.Cell(1, 1).Style.Font.Bold = true;
            instrWs.Cell(1, 1).Style.Font.FontSize = 14;

            instrWs.Cell(3, 1).Value = "Column Descriptions:";
            instrWs.Cell(3, 1).Style.Font.Bold = true;

            instrWs.Cell(4, 1).Value = "• Student Name — Full name (first and last) in a single column";
            instrWs.Cell(5, 1).Value = "• W# — Southeastern student ID starting with W followed by 7 digits (e.g. W0715502)";
            instrWs.Cell(6, 1).Value = "• Semester — The semester level (1-5). Accepts '1' or 'Semester 1' format";
            instrWs.Cell(7, 1).Value = "• Location Tag — Campus location: B = Baton Rouge, H = Hammond";

            instrWs.Cell(9, 1).Value = "Valid Location Tag Values:";
            instrWs.Cell(9, 1).Style.Font.Bold = true;
            instrWs.Cell(10, 1).Value = "• B — Baton Rouge campus";
            instrWs.Cell(11, 1).Value = "• H — Hammond campus";

            instrWs.Cell(13, 1).Value = "Notes:";
            instrWs.Cell(13, 1).Style.Font.Bold = true;
            instrWs.Cell(14, 1).Value = "• The W# must be unique per semester — duplicates will be flagged as errors";
            instrWs.Cell(15, 1).Value = "• Students are auto-assigned to schedule groups based on semester level and campus";
            instrWs.Cell(16, 1).Value = "• Groups fill sequentially to capacity (default 8) before moving to the next group";

            instrWs.Column(1).Width = 80;

            var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Nursing_Student_Import_Template.xlsx");
        }

        //parse csv file into student records (new 4-column format)
        private async Task<List<ImportedStudentDto>> ParseCsv(IFormFile file)
        {
            var result = new List<ImportedStudentDto>();
            using var reader = new StreamReader(file.OpenReadStream());

            //skip header
            var header = await reader.ReadLineAsync();
            var rowNum = 1;

            while (await reader.ReadLineAsync() is { } line)
            {
                rowNum++;
                var parts = line.Split(',').Select(p => p.Trim('"', ' ')).ToArray();
                if (parts.Length < 4) continue;
                if (string.IsNullOrWhiteSpace(parts[0]) && string.IsNullOrWhiteSpace(parts[1])) continue;

                result.Add(new ImportedStudentDto
                {
                    Name = parts[0].Trim(),
                    WNumber = parts[1].Trim(),
                    SemesterLevel = ParseSemesterLevel(parts[2].Trim()),
                    LocationTag = parts[3].Trim().ToUpper(),
                    RowNumber = rowNum
                });
            }
            return result;
        }

        //parse xlsx file into student records (new 4-column format)
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
                var name = worksheet.Cell(row, 1).GetString().Trim();
                var wNumber = worksheet.Cell(row, 2).GetString().Trim();
                if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(wNumber)) continue;

                var semesterRaw = worksheet.Cell(row, 3).GetString().Trim();
                var locationTag = worksheet.Cell(row, 4).GetString().Trim().ToUpper();

                result.Add(new ImportedStudentDto
                {
                    Name = name,
                    WNumber = wNumber,
                    SemesterLevel = ParseSemesterLevel(semesterRaw),
                    LocationTag = locationTag,
                    RowNumber = row
                });
            }
            return result;
        }

        //lenient semester level parsing: accepts "1", "Semester 1", "semester 3", etc
        private static int ParseSemesterLevel(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return 0;

            //try direct int parse
            if (int.TryParse(raw, out var direct) && direct >= 1 && direct <= 5)
                return direct;

            //try "Semester N" format
            var match = Regex.Match(raw, @"(?:semester\s*)(\d+)", RegexOptions.IgnoreCase);
            if (match.Success && int.TryParse(match.Groups[1].Value, out var parsed) && parsed >= 1 && parsed <= 5)
                return parsed;

            return 0; //invalid — will be caught by validation
        }

        // ===== instructor import =====

        //upload xlsx and preview parsed instructors
        [HttpPost("instructors")]
        public async Task<ActionResult<InstructorImportResultDto>> ImportInstructors(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".xlsx")
                return BadRequest("Only .xlsx files are supported");

            var rows = await ParseInstructorXlsx(file);
            if (rows.Count == 0)
                return BadRequest("No valid instructor records found in file");

            var valid = new List<ImportedInstructorDto>();
            var errors = new List<ImportRowError>();

            foreach (var row in rows)
            {
                if (string.IsNullOrWhiteSpace(row.Name))
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Name", Message = "Name is required" });
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(row.Email) && !row.Email.EndsWith("@selu.edu", StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Email", Message = $"Email must be @selu.edu (got '{row.Email}')" });
                    continue;
                }

                var normalizedType = NormalizeInstructorType(row.Type);
                if (normalizedType == null)
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Type", Message = $"Invalid type '{row.Type}' — must be FullTime, Adjunct, or Overload" });
                    continue;
                }
                row.Type = normalizedType;

                valid.Add(row);
            }

            return Ok(new InstructorImportResultDto
            {
                TotalParsed = rows.Count,
                Valid = valid,
                Errors = errors
            });
        }

        //commit validated instructors — upsert by email or name
        [HttpPost("instructors/commit")]
        public async Task<ActionResult> CommitInstructors([FromBody] List<CommitInstructorDto> instructors)
        {
            var username = User.GetUsername() ?? "unknown";
            var existing = await _context.Instructors.ToListAsync();
            var inserted = 0;
            var updated = 0;

            foreach (var dto in instructors)
            {
                var normalizedType = NormalizeInstructorType(dto.Type);
                if (normalizedType == null) continue;

                if (!Enum.TryParse<InstructorType>(normalizedType, out var typeEnum))
                    continue;

                //upsert: match on email if present, otherwise on name
                Instructor? match = null;
                if (!string.IsNullOrWhiteSpace(dto.Email))
                    match = existing.FirstOrDefault(i => string.Equals(i.Email, dto.Email, StringComparison.OrdinalIgnoreCase));
                match ??= existing.FirstOrDefault(i => string.Equals(i.Name, dto.Name, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    match.Name = dto.Name;
                    match.Email = dto.Email;
                    match.Type = typeEnum;
                    match.Phone = dto.Phone;
                    updated++;
                }
                else
                {
                    var inst = new Instructor
                    {
                        Name = dto.Name,
                        Email = dto.Email,
                        Type = typeEnum,
                        Phone = dto.Phone
                    };
                    _context.Instructors.Add(inst);
                    existing.Add(inst);
                    inserted++;
                }
            }

            await _context.SaveChangesAsync();

            if (inserted + updated > 0)
            {
                await _auditService.LogChange("Instructor", 0, "BulkImport", username,
                    $"Imported instructors: {inserted} new, {updated} updated");
            }

            return Ok(new { Inserted = inserted, Updated = updated });
        }

        //download instructor import template
        [HttpGet("instructors/template")]
        public IActionResult DownloadInstructorTemplate()
        {
            using var workbook = new ClosedXML.Excel.XLWorkbook();

            var ws = workbook.Worksheets.Add("Instructors");
            ws.Cell(1, 1).Value = "Name";
            ws.Cell(1, 2).Value = "Email";
            ws.Cell(1, 3).Value = "Type";
            ws.Cell(1, 4).Value = "Phone";

            var headerRange = ws.Range(1, 1, 1, 4);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#00563F");
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;

            ws.Cell(2, 1).Value = "Jane Smith";
            ws.Cell(2, 2).Value = "jsmith@selu.edu";
            ws.Cell(2, 3).Value = "FullTime";
            ws.Cell(2, 4).Value = "(985) 549-2100";

            ws.Cell(3, 1).Value = "John Doe";
            ws.Cell(3, 2).Value = "jdoe@selu.edu";
            ws.Cell(3, 3).Value = "Adjunct";
            ws.Cell(3, 4).Value = "";

            ws.Cell(4, 1).Value = "Maria Garcia";
            ws.Cell(4, 2).Value = "mgarcia@selu.edu";
            ws.Cell(4, 3).Value = "Overload";
            ws.Cell(4, 4).Value = "(985) 549-3000";

            ws.Columns().AdjustToContents();

            var instrWs = workbook.Worksheets.Add("Instructions");
            instrWs.Cell(1, 1).Value = "Instructor Import Template — Instructions";
            instrWs.Cell(1, 1).Style.Font.Bold = true;
            instrWs.Cell(1, 1).Style.Font.FontSize = 14;

            instrWs.Cell(3, 1).Value = "Column Descriptions:";
            instrWs.Cell(3, 1).Style.Font.Bold = true;
            instrWs.Cell(4, 1).Value = "• Name — Full name (required)";
            instrWs.Cell(5, 1).Value = "• Email — Must be @selu.edu if provided (optional)";
            instrWs.Cell(6, 1).Value = "• Type — FullTime, Adjunct, or Overload (required)";
            instrWs.Cell(7, 1).Value = "• Phone — Contact phone number (optional, free-form)";

            instrWs.Cell(9, 1).Value = "Upsert Rules:";
            instrWs.Cell(9, 1).Style.Font.Bold = true;
            instrWs.Cell(10, 1).Value = "• If an email matches an existing instructor, that record is updated";
            instrWs.Cell(11, 1).Value = "• If no email match, name is used to match existing records";
            instrWs.Cell(12, 1).Value = "• New instructors are inserted if no match is found";

            instrWs.Column(1).Width = 80;

            var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Nursing_Instructor_Import_Template.xlsx");
        }

        //parse instructor xlsx
        private async Task<List<ImportedInstructorDto>> ParseInstructorXlsx(IFormFile file)
        {
            var result = new List<ImportedInstructorDto>();
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
            var worksheet = workbook.Worksheets.First();

            var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
            for (int row = 2; row <= rowCount; row++)
            {
                var name = worksheet.Cell(row, 1).GetString().Trim();
                var email = worksheet.Cell(row, 2).GetString().Trim();
                var type = worksheet.Cell(row, 3).GetString().Trim();
                var phone = worksheet.Cell(row, 4).GetString().Trim();
                if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(email)) continue;

                result.Add(new ImportedInstructorDto
                {
                    Name = name,
                    Email = string.IsNullOrWhiteSpace(email) ? null : email,
                    Type = type,
                    Phone = string.IsNullOrWhiteSpace(phone) ? null : phone,
                    RowNumber = row
                });
            }
            return result;
        }

        //normalize instructor type string to canonical enum value
        private static string? NormalizeInstructorType(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            //direct match
            if (ValidInstructorTypes.Contains(raw)) return ValidInstructorTypes.First(t => t.Equals(raw, StringComparison.OrdinalIgnoreCase));
            //handle "Full Time" → "FullTime", "Part Time" → "Adjunct" alias
            var cleaned = raw.Replace(" ", "").Replace("-", "");
            if (ValidInstructorTypes.Contains(cleaned)) return ValidInstructorTypes.First(t => t.Equals(cleaned, StringComparison.OrdinalIgnoreCase));
            return null;
        }

        // ===== room import =====

        //upload xlsx and preview parsed rooms
        [HttpPost("rooms")]
        public async Task<ActionResult<RoomImportResultDto>> ImportRooms(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".xlsx")
                return BadRequest("Only .xlsx files are supported");

            var rows = await ParseRoomXlsx(file);
            if (rows.Count == 0)
                return BadRequest("No valid room records found in file");

            var valid = new List<ImportedRoomDto>();
            var errors = new List<ImportRowError>();

            foreach (var row in rows)
            {
                if (string.IsNullOrWhiteSpace(row.Number))
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Number", Message = "Room number is required" });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(row.Building))
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Building", Message = "Building is required" });
                    continue;
                }

                var normalizedCampus = NormalizeCampus(row.Campus);
                if (normalizedCampus == null)
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Campus", Message = $"Invalid campus '{row.Campus}' — must be Hammond, BatonRouge, or StTammany" });
                    continue;
                }
                row.Campus = normalizedCampus;

                if (row.Capacity < 1 || row.Capacity > 200)
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Capacity", Message = $"Capacity must be 1–200 (got {row.Capacity})" });
                    continue;
                }

                var normalizedType = NormalizeRoomType(row.Type);
                if (normalizedType == null)
                {
                    errors.Add(new ImportRowError { Row = row.RowNumber, Field = "Type", Message = $"Invalid type '{row.Type}' — must be Lecture, Lab, SimLab, Clinical, or Online" });
                    continue;
                }
                row.Type = normalizedType;

                valid.Add(row);
            }

            return Ok(new RoomImportResultDto
            {
                TotalParsed = rows.Count,
                Valid = valid,
                Errors = errors
            });
        }

        //commit validated rooms — upsert by (campus, number) pair
        [HttpPost("rooms/commit")]
        public async Task<ActionResult> CommitRooms([FromBody] List<CommitRoomDto> rooms)
        {
            var username = User.GetUsername() ?? "unknown";
            var existing = await _context.Rooms.ToListAsync();
            var inserted = 0;
            var updated = 0;

            foreach (var dto in rooms)
            {
                var normalizedCampus = NormalizeCampus(dto.Campus);
                var normalizedType = NormalizeRoomType(dto.Type);
                if (normalizedCampus == null || normalizedType == null) continue;

                if (!Enum.TryParse<RoomType>(normalizedType, out var typeEnum))
                    continue;

                //upsert: match on (campus, number) pair
                var match = existing.FirstOrDefault(r =>
                    string.Equals(r.Campus, normalizedCampus, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(r.RoomNumber, dto.Number, StringComparison.OrdinalIgnoreCase));

                if (match != null)
                {
                    match.Building = dto.Building;
                    match.Capacity = dto.Capacity;
                    match.Type = typeEnum;
                    updated++;
                }
                else
                {
                    var room = new Room
                    {
                        RoomNumber = dto.Number,
                        Building = dto.Building,
                        Campus = normalizedCampus,
                        Capacity = dto.Capacity,
                        Type = typeEnum
                    };
                    _context.Rooms.Add(room);
                    existing.Add(room);
                    inserted++;
                }
            }

            await _context.SaveChangesAsync();

            if (inserted + updated > 0)
            {
                await _auditService.LogChange("Room", 0, "BulkImport", username,
                    $"Imported rooms: {inserted} new, {updated} updated");
            }

            return Ok(new { Inserted = inserted, Updated = updated });
        }

        //download room import template
        [HttpGet("rooms/template")]
        public IActionResult DownloadRoomTemplate()
        {
            using var workbook = new ClosedXML.Excel.XLWorkbook();

            var ws = workbook.Worksheets.Add("Rooms");
            ws.Cell(1, 1).Value = "Number";
            ws.Cell(1, 2).Value = "Building";
            ws.Cell(1, 3).Value = "Campus";
            ws.Cell(1, 4).Value = "Capacity";
            ws.Cell(1, 5).Value = "Type";

            var headerRange = ws.Range(1, 1, 1, 5);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#00563F");
            headerRange.Style.Font.FontColor = ClosedXML.Excel.XLColor.White;

            ws.Cell(2, 1).Value = "KHSA 1005";
            ws.Cell(2, 2).Value = "Kiva Hall of Science Annex";
            ws.Cell(2, 3).Value = "Hammond";
            ws.Cell(2, 4).Value = 35;
            ws.Cell(2, 5).Value = "Lecture";

            ws.Cell(3, 1).Value = "BRC-258";
            ws.Cell(3, 2).Value = "Baton Rouge Center";
            ws.Cell(3, 3).Value = "BatonRouge";
            ws.Cell(3, 4).Value = 8;
            ws.Cell(3, 5).Value = "Lab";

            ws.Cell(4, 1).Value = "SIM-101";
            ws.Cell(4, 2).Value = "Nursing Building";
            ws.Cell(4, 3).Value = "Hammond";
            ws.Cell(4, 4).Value = 12;
            ws.Cell(4, 5).Value = "SimLab";

            ws.Columns().AdjustToContents();

            var instrWs = workbook.Worksheets.Add("Instructions");
            instrWs.Cell(1, 1).Value = "Room Import Template — Instructions";
            instrWs.Cell(1, 1).Style.Font.Bold = true;
            instrWs.Cell(1, 1).Style.Font.FontSize = 14;

            instrWs.Cell(3, 1).Value = "Column Descriptions:";
            instrWs.Cell(3, 1).Style.Font.Bold = true;
            instrWs.Cell(4, 1).Value = "• Number — Room identifier, e.g. 'KHSA 1005' (required)";
            instrWs.Cell(5, 1).Value = "• Building — Building name, e.g. 'Kiva Hall of Science Annex' (required)";
            instrWs.Cell(6, 1).Value = "• Campus — Hammond, BatonRouge, or StTammany (required)";
            instrWs.Cell(7, 1).Value = "• Capacity — Room capacity, 1–200 (required)";
            instrWs.Cell(8, 1).Value = "• Type — Lecture, Lab, SimLab, Clinical, or Online (required)";

            instrWs.Cell(10, 1).Value = "Upsert Rules:";
            instrWs.Cell(10, 1).Style.Font.Bold = true;
            instrWs.Cell(11, 1).Value = "• Rooms are matched by (Campus, Number) pair";
            instrWs.Cell(12, 1).Value = "• If a match is found, capacity/type/building are updated";
            instrWs.Cell(13, 1).Value = "• If no match, a new room is inserted";

            instrWs.Column(1).Width = 80;

            var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Nursing_Room_Import_Template.xlsx");
        }

        //parse room xlsx
        private async Task<List<ImportedRoomDto>> ParseRoomXlsx(IFormFile file)
        {
            var result = new List<ImportedRoomDto>();
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
            var worksheet = workbook.Worksheets.First();

            var rowCount = worksheet.LastRowUsed()?.RowNumber() ?? 0;
            for (int row = 2; row <= rowCount; row++)
            {
                var number = worksheet.Cell(row, 1).GetString().Trim();
                var building = worksheet.Cell(row, 2).GetString().Trim();
                var campus = worksheet.Cell(row, 3).GetString().Trim();
                var capacityRaw = worksheet.Cell(row, 4).GetString().Trim();
                var type = worksheet.Cell(row, 5).GetString().Trim();
                if (string.IsNullOrWhiteSpace(number) && string.IsNullOrWhiteSpace(building)) continue;

                int.TryParse(capacityRaw, out var capacity);

                result.Add(new ImportedRoomDto
                {
                    Number = number,
                    Building = building,
                    Campus = campus,
                    Capacity = capacity,
                    Type = type,
                    RowNumber = row
                });
            }
            return result;
        }

        //normalize campus string to canonical value
        private static string? NormalizeCampus(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var cleaned = raw.Replace(" ", "").Replace("-", "");
            if (string.Equals(cleaned, "Hammond", StringComparison.OrdinalIgnoreCase)) return "Hammond";
            if (string.Equals(cleaned, "BatonRouge", StringComparison.OrdinalIgnoreCase)) return "Baton Rouge";
            if (string.Equals(cleaned, "StTammany", StringComparison.OrdinalIgnoreCase)) return "St. Tammany";
            //also accept display forms
            if (cleaned.Contains("Baton", StringComparison.OrdinalIgnoreCase)) return "Baton Rouge";
            if (cleaned.Contains("Tammany", StringComparison.OrdinalIgnoreCase)) return "St. Tammany";
            if (string.Equals(cleaned, "Hammond", StringComparison.OrdinalIgnoreCase)) return "Hammond";
            return null;
        }

        //normalize room type string to canonical enum value
        private static string? NormalizeRoomType(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            //direct match against known types
            foreach (var valid in new[] { "Lecture", "Lab", "SimLab", "Clinical", "Online" })
            {
                if (string.Equals(raw, valid, StringComparison.OrdinalIgnoreCase)) return valid;
            }
            //aliases from the prompt spec
            if (string.Equals(raw, "Classroom", StringComparison.OrdinalIgnoreCase)) return "Lecture";
            if (string.Equals(raw, "Conference", StringComparison.OrdinalIgnoreCase)) return "Lecture";
            return null;
        }
    }
}
