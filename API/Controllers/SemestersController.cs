using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Semester;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SemestersController : ControllerBase
    {
        private readonly DataContext _context;

        public SemestersController(DataContext context)
        {
            _context = context;
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
                    ClinicalDays = s.ClinicalDays
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

            return Ok(new SemesterDto
            {
                Id = semester.Id,
                Name = semester.Name,
                StartDate = semester.StartDate,
                EndDate = semester.EndDate,
                ClinicalDays = semester.ClinicalDays
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

            _context.Semesters.Remove(semester);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //update semester details
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSemester(int id, CreateSemesterDto updateDto)
        {
            var semester = await _context.Semesters.FindAsync(id);
            if (semester == null) return NotFound();

            semester.Name = updateDto.Name;
            semester.StartDate = updateDto.StartDate;
            semester.EndDate = updateDto.EndDate;
            semester.ClinicalDays = updateDto.ClinicalDays;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}