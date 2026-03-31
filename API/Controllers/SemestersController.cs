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
                .Select(s => new SemesterDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    ClinicalDays = s.ClinicalDays,
                    IsLocked = s.IsLocked
                })
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

            return Ok(new SemesterDto
            {
                Id = semester.Id,
                Name = semester.Name,
                StartDate = semester.StartDate,
                EndDate = semester.EndDate,
                ClinicalDays = semester.ClinicalDays,
                IsLocked = semester.IsLocked
            });
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

            return Ok(new SemesterDto
            {
                Id = newSemester.Id,
                Name = newSemester.Name,
                StartDate = newSemester.StartDate,
                EndDate = newSemester.EndDate,
                ClinicalDays = newSemester.ClinicalDays,
                IsLocked = newSemester.IsLocked
            });
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
    }
}