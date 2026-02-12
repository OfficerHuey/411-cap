using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Semester;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
    }
}