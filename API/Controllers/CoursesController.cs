using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Course;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly DataContext _context;

        public CoursesController(DataContext context)
        {
            _context = context;
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
                    DefaultType = c.DefaultType
                })
                .ToListAsync();

            return Ok(courses);
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
                DefaultType = createDto.DefaultType
            };
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            createDto.Id = course.Id;
            return Ok(createDto);
        }
    }
}