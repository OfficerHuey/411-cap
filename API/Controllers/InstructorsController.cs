using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Instructor;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InstructorsController : ControllerBase
    {
        private readonly DataContext _context;

        public InstructorsController(DataContext context)
        {
            _context = context;
        }

        //get all instructors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InstructorDto>>> GetInstructors()
        {
            var instructors = await _context.Instructors
                .Select(i => new InstructorDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Email = i.Email,
                    Type = i.Type,
                    TotalWorkloadHours = 0
                })
                .ToListAsync();

            return Ok(instructors);
        }

        //get instructor with assigned sections
        [HttpGet("{id}")]
        public async Task<ActionResult<InstructorDto>> GetInstructor(int id)
        {
            var instructor = await _context.Instructors
                .Include(i => i.Sections)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null) return NotFound();

            return Ok(new InstructorDto
            {
                Id = instructor.Id,
                Name = instructor.Name,
                Email = instructor.Email,
                Type = instructor.Type,
                TotalWorkloadHours = CalculateWorkloadHours(instructor.Sections)
            });
        }

        //create a new instructor
        [HttpPost]
        public async Task<ActionResult<InstructorDto>> CreateInstructor(CreateInstructorDto createDto)
        {
            var instructor = new Instructor
            {
                Name = createDto.Name,
                Email = createDto.Email,
                Type = createDto.Type
            };

            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();

            return Ok(new InstructorDto
            {
                Id = instructor.Id,
                Name = instructor.Name,
                Email = instructor.Email,
                Type = instructor.Type,
                TotalWorkloadHours = 0
            });
        }

        //update instructor details
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateInstructor(int id, CreateInstructorDto updateDto)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null) return NotFound();

            instructor.Name = updateDto.Name;
            instructor.Email = updateDto.Email;
            instructor.Type = updateDto.Type;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        //delete an instructor
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteInstructor(int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null) return NotFound();

            _context.Instructors.Remove(instructor);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //get instructor workload for a specific semester
        [HttpGet("{id}/workload")]
        public async Task<ActionResult> GetWorkload(int id, [FromQuery] int semesterId)
        {
            var instructor = await _context.Instructors
                .Include(i => i.Sections.Where(s => s.SemesterId == semesterId))
                    .ThenInclude(s => s.Course)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null) return NotFound();

            var sections = instructor.Sections.Select(s => new SectionDto
            {
                Id = s.Id,
                SectionNumber = s.SectionNumber,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Notes = s.Notes,
                DateRange = s.DateRange,
                Term = s.Term,
                TermStartDate = s.TermStartDate,
                TermEndDate = s.TermEndDate,
                RoomId = s.RoomId,
                InstructorId = s.InstructorId,
                InstructorName = instructor.Name,
                CourseId = s.CourseId,
                CourseCode = s.Course!.Code,
                CourseName = s.Course.Name,
                CourseType = s.Course.DefaultType
            }).ToList();

            return Ok(new
            {
                InstructorId = instructor.Id,
                InstructorName = instructor.Name,
                TotalHours = CalculateWorkloadHours(instructor.Sections),
                Sections = sections
            });
        }

        //calculate total weekly hours from section time ranges
        private double CalculateWorkloadHours(ICollection<Section> sections)
        {
            double total = 0;
            foreach (var s in sections)
            {
                if (s.StartTime.HasValue && s.EndTime.HasValue)
                    total += (s.EndTime.Value - s.StartTime.Value).TotalHours;
            }
            return total;
        }
    }
}
