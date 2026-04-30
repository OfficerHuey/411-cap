using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Course;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CoursesController : ControllerBase
    {
        private readonly DataContext _context;

        public CoursesController(DataContext context)
        {
            _context = context;
        }

        //getallcoursesacrossalllevels
        //usage:api/courses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetAll()
        {
            var courses = await _context.Courses
                .OrderBy(c => c.SemesterLevel)
                .ThenBy(c => c.Code)
                .Select(c => new CourseDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Name = c.Name,
                    SemesterLevel = c.SemesterLevel,
                    DefaultType = c.DefaultType,
                    CreditHours = c.CreditHours
                })
                .ToListAsync();

            return Ok(courses);
        }

        // get courses filtered by semester level (1-5)
        // usage: api/courses/palette/1
        [HttpGet("palette/{semesterLevel}")]
        public async Task<ActionResult<IEnumerable<CourseDto>>> GetPalette(int semesterLevel)
        {
            var courses = await _context.Courses
                .Where(c => c.SemesterLevel == semesterLevel)
                .Select(c => new CourseDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Name = c.Name,
                    SemesterLevel = c.SemesterLevel,
                    DefaultType = c.DefaultType,
                    CreditHours = c.CreditHours
                })
                .ToListAsync();

            return Ok(courses);
        }

        //getcoursestatsforthecoursespageheader
        //usage:api/courses/stats
        [HttpGet("stats")]
        public async Task<ActionResult> GetStats()
        {
            var courses = await _context.Courses.ToListAsync();
            var byLevel = courses
                .GroupBy(c => c.SemesterLevel)
                .OrderBy(g => g.Key)
                .Select(g => new { level = g.Key, count = g.Count() })
                .ToList();

            var byType = courses
                .GroupBy(c => c.DefaultType.ToString())
                .Select(g => new { type = g.Key, count = g.Count() })
                .ToList();

            return Ok(new { total = courses.Count, byLevel, byType });
        }

        //post- api/courses
        // in case a course needs to be added manually
        [HttpPost]
        public async Task<ActionResult<CourseDto>> AddCourse(CourseDto createDto)
        {
            var course = new Course
            {
                Code = createDto.Code,
                Name = createDto.Name,
                SemesterLevel = createDto.SemesterLevel,
                DefaultType = createDto.DefaultType,
                CreditHours = createDto.CreditHours
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            createDto.Id = course.Id;
            return Ok(createDto);
        }

        //updateanexistingcourse
        //usage:put/api/courses/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCourse(int id, CourseDto updateDto)
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();

            course.Code = updateDto.Code;
            course.Name = updateDto.Name;
            course.SemesterLevel = updateDto.SemesterLevel;
            course.DefaultType = updateDto.DefaultType;
            course.CreditHours = updateDto.CreditHours;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        //deleteacourseifnosectionsreferenceit
        //usage:delete/api/courses/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Sections)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (course == null) return NotFound();

            //safetydontdeleteifsectionsreferencethiscourse
            if (course.Sections != null && course.Sections.Any())
                return BadRequest($"Cannot delete — {course.Sections.Count} section(s) reference this course. Remove all sections first.");

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
