using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Semester;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SemestersController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IAuditService _auditService;

        public SemestersController(DataContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        //get all semesters for the dashboard list
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SemesterDto>>> GetSemesters()
        {
            var semesters = await _context.Semesters
                .Select(s => MapToDto(s))
                .ToListAsync();

            return Ok(semesters);
        }

        //create a new semester (the lobby)
        [HttpPost]
        public async Task<ActionResult<SemesterDto>> CreateSemester(CreateSemesterDto createDto)
        {
            var semester = new Semester
            {
                Name = createDto.Name,
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                ClinicalDays = createDto.ClinicalDays
            };

            _context.Semesters.Add(semester);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", semester.Id, "Created", username, null, semester.Id);

            return Ok(MapToDto(semester));
        }

        //delete a semester and cascade to all related data
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteSemester(int id)
        {
            var semester = await _context.Semesters
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.ScheduleSections)
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.Students)
                .Include(s => s.Sections)
                    .ThenInclude(sec => sec.ScheduleSections)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (semester == null) return NotFound();
            if (semester.IsLocked) return BadRequest("This semester is locked and cannot be modified");

            //clear notes referencing this semester (NoAction FK, app-layer cleanup)
            var affectedNotes = await _context.Notes
                .Where(n => n.SemesterId == id)
                .ToListAsync();
            foreach (var note in affectedNotes)
                note.SemesterId = null;

            _context.Semesters.Remove(semester);
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", id, "Deleted", username, null, id);

            return NoContent();
        }

        //update semester details
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSemester(int id, CreateSemesterDto updateDto)
        {
            var semester = await _context.Semesters.FindAsync(id);
            if (semester == null) return NotFound();
            if (semester.IsLocked) return BadRequest("This semester is locked and cannot be modified");

            semester.Name = updateDto.Name;
            semester.StartDate = updateDto.StartDate;
            semester.EndDate = updateDto.EndDate;
            semester.ClinicalDays = updateDto.ClinicalDays;

            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", semester.Id, "Updated", username, null, semester.Id);

            return NoContent();
        }

        //clone a semester's structure into a new semester without students
        [HttpPost("clone/{sourceSemesterId}")]
        public async Task<ActionResult<SemesterDto>> CloneSemester(int sourceSemesterId, CreateSemesterDto newSemesterDto)
        {
            var source = await _context.Semesters
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.ScheduleSections)
                        .ThenInclude(ss => ss.Section)
                .Include(s => s.Sections)
                .FirstOrDefaultAsync(s => s.Id == sourceSemesterId);

            if (source == null) return NotFound("Source semester not found");

            //create the new semester shell
            var newSemester = new Semester
            {
                Name = newSemesterDto.Name,
                StartDate = newSemesterDto.StartDate,
                EndDate = newSemesterDto.EndDate,
                ClinicalDays = newSemesterDto.ClinicalDays
            };
            _context.Semesters.Add(newSemester);
            await _context.SaveChangesAsync();

            //clone sections without students or instructors
            var sectionMap = new Dictionary<int, int>();
            foreach (var sourceSection in source.Sections)
            {
                var newSection = new Section
                {
                    SectionNumber = sourceSection.SectionNumber,
                    DayOfWeek = sourceSection.DayOfWeek,
                    StartTime = sourceSection.StartTime,
                    EndTime = sourceSection.EndTime,
                    DateRange = sourceSection.DateRange,
                    Notes = sourceSection.Notes,
                    CourseId = sourceSection.CourseId,
                    SemesterId = newSemester.Id,
                    RoomId = sourceSection.RoomId,
                    Term = sourceSection.Term
                };
                _context.Sections.Add(newSection);
                await _context.SaveChangesAsync();
                sectionMap[sourceSection.Id] = newSection.Id;
            }

            //clone schedule groups without students
            foreach (var sourceSchedule in source.Schedules)
            {
                var newSchedule = new Schedule
                {
                    Name = sourceSchedule.Name,
                    SemesterLevel = sourceSchedule.SemesterLevel,
                    LocationDisplay = sourceSchedule.LocationDisplay,
                    SemesterId = newSemester.Id,
                    Capacity = sourceSchedule.Capacity
                };
                _context.Schedules.Add(newSchedule);
                await _context.SaveChangesAsync();

                //re-create the schedule-section links
                foreach (var ss in sourceSchedule.ScheduleSections)
                {
                    if (sectionMap.ContainsKey(ss.SectionId))
                    {
                        _context.ScheduleSections.Add(new ScheduleSection
                        {
                            ScheduleId = newSchedule.Id,
                            SectionId = sectionMap[ss.SectionId]
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", newSemester.Id, "Cloned", username, $"Cloned from semester {sourceSemesterId}", newSemester.Id);

            return Ok(MapToDto(newSemester));
        }

        //toggle lock state for a semester
        [HttpPut("{id}/lock")]
        public async Task<ActionResult> ToggleLock(int id)
        {
            var semester = await _context.Semesters.FindAsync(id);
            if (semester == null) return NotFound();

            semester.IsLocked = !semester.IsLocked;
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", semester.Id, semester.IsLocked ? "Locked" : "Unlocked", username, null, semester.Id);

            return Ok(new { semester.IsLocked });
        }

        //mark a semester as an anchor template for a clinical day rotation
        [HttpPut("{id}/anchor")]
        public async Task<ActionResult<SemesterDto>> SetAnchor(int id, [FromBody] SetAnchorDto dto)
        {
            var semester = await _context.Semesters.FindAsync(id);
            if (semester == null) return NotFound();

            //clear any existing anchor for the same rotation
            var existingAnchor = await _context.Semesters
                .FirstOrDefaultAsync(s => s.IsAnchorTemplate && s.AnchorRotation == dto.Rotation && s.Id != id);

            if (existingAnchor != null)
            {
                existingAnchor.IsAnchorTemplate = false;
                existingAnchor.AnchorRotation = null;

                var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
                await _auditService.LogChange("Semester", existingAnchor.Id, "Anchor unmarked",
                    username, $"Replaced by semester {id} as {dto.Rotation} anchor", existingAnchor.Id);
            }

            semester.IsAnchorTemplate = true;
            semester.AnchorRotation = dto.Rotation;
            await _context.SaveChangesAsync();

            var user = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", semester.Id, "Anchor set",
                user, $"Marked as {dto.Rotation} anchor template", semester.Id);

            return Ok(MapToDto(semester));
        }

        //unmark a semester as an anchor template
        [HttpDelete("{id}/anchor")]
        public async Task<ActionResult> ClearAnchor(int id)
        {
            var semester = await _context.Semesters.FindAsync(id);
            if (semester == null) return NotFound();

            semester.IsAnchorTemplate = false;
            semester.AnchorRotation = null;
            await _context.SaveChangesAsync();

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", semester.Id, "Anchor unmarked", username, null, semester.Id);

            return NoContent();
        }

        //get both current anchor templates
        [HttpGet("anchors")]
        public async Task<ActionResult> GetAnchors()
        {
            var anchors = await _context.Semesters
                .Where(s => s.IsAnchorTemplate)
                .ToListAsync();

            var tuesWed = anchors.FirstOrDefault(s => s.AnchorRotation == ClinicalDayRotation.TuesWed);
            var thursFri = anchors.FirstOrDefault(s => s.AnchorRotation == ClinicalDayRotation.ThursFri);

            return Ok(new
            {
                tuesWedAnchor = tuesWed != null ? MapToDto(tuesWed) : null,
                thursFriAnchor = thursFri != null ? MapToDto(thursFri) : null
            });
        }

        //clone from a named anchor rotation into a new semester
        [HttpPost("clone-from-anchor")]
        public async Task<ActionResult<SemesterDto>> CloneFromAnchor([FromBody] CloneFromAnchorDto dto)
        {
            var anchor = await _context.Semesters
                .Include(s => s.Schedules)
                    .ThenInclude(sch => sch.ScheduleSections)
                        .ThenInclude(ss => ss.Section)
                .Include(s => s.Sections)
                .FirstOrDefaultAsync(s => s.IsAnchorTemplate && s.AnchorRotation == dto.Rotation);

            if (anchor == null)
                return NotFound($"No anchor template exists for the {dto.Rotation} rotation. Mark a semester as an anchor first.");

            //create the new semester shell
            var newSemester = new Semester
            {
                Name = dto.NewName,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                ClinicalDays = dto.ClinicalDays
            };
            _context.Semesters.Add(newSemester);
            await _context.SaveChangesAsync();

            //clone sections (without instructor assignments)
            var sectionMap = new Dictionary<int, int>();
            foreach (var sourceSection in anchor.Sections)
            {
                var newSection = new Section
                {
                    SectionNumber = sourceSection.SectionNumber,
                    DayOfWeek = sourceSection.DayOfWeek,
                    StartTime = sourceSection.StartTime,
                    EndTime = sourceSection.EndTime,
                    DateRange = sourceSection.DateRange,
                    Notes = sourceSection.Notes,
                    CourseId = sourceSection.CourseId,
                    SemesterId = newSemester.Id,
                    RoomId = sourceSection.RoomId,
                    Term = sourceSection.Term
                };
                _context.Sections.Add(newSection);
                await _context.SaveChangesAsync();
                sectionMap[sourceSection.Id] = newSection.Id;
            }

            //clone schedule groups (without students)
            foreach (var sourceSchedule in anchor.Schedules)
            {
                var newSchedule = new Schedule
                {
                    Name = sourceSchedule.Name,
                    SemesterLevel = sourceSchedule.SemesterLevel,
                    LocationDisplay = sourceSchedule.LocationDisplay,
                    SemesterId = newSemester.Id,
                    Capacity = sourceSchedule.Capacity
                };
                _context.Schedules.Add(newSchedule);
                await _context.SaveChangesAsync();

                foreach (var ss in sourceSchedule.ScheduleSections)
                {
                    if (sectionMap.ContainsKey(ss.SectionId))
                    {
                        _context.ScheduleSections.Add(new ScheduleSection
                        {
                            ScheduleId = newSchedule.Id,
                            SectionId = sectionMap[ss.SectionId]
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            var username = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";
            await _auditService.LogChange("Semester", newSemester.Id, "Cloned from anchor",
                username, $"Cloned from {dto.Rotation} anchor (semester {anchor.Id})", newSemester.Id);

            return Ok(MapToDto(newSemester));
        }

        //shared mapping helper
        private static SemesterDto MapToDto(Semester s) => new SemesterDto
        {
            Id = s.Id,
            Name = s.Name,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            ClinicalDays = s.ClinicalDays,
            IsLocked = s.IsLocked,
            IsAnchorTemplate = s.IsAnchorTemplate,
            AnchorRotation = s.AnchorRotation
        };
    }

    //dto for setting anchor rotation
    public class SetAnchorDto
    {
        public ClinicalDayRotation Rotation { get; set; }
    }

    //dto for cloning from an anchor
    public class CloneFromAnchorDto
    {
        public ClinicalDayRotation Rotation { get; set; }
        public required string NewName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? ClinicalDays { get; set; }
    }
}