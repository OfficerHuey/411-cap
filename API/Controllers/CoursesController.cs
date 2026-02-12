using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/courses")]
    public class CoursesController : ControllerBase
    {
        private readonly DataContext _dataContext;

        public CoursesController(DataContext dataContext)
        {
            _dataContext = dataContext;
        }

        [HttpGet("pallete/{semesterLevel}")] => api/courses/pallete/1
        public IActionResult GetPallete(int semesterLevel)
        {
            var respose = new Response();

            var coursesToGet = _dataContext.Courses
                .Where(Courses => (Courses.SemesterLevel == semesterLevel))
                .Select(Courses => new CourseDto
                {
                    Id = Courses.Id,
                    Code = Courses.Code,
                    Name = Courses.Name,
                    SemesterLevel = Courses.SemesterLevel,
                    //CourseType = Courses.CourseType
                }
                ).ToListAsync();

            if(coursesToGet.Count <= 0)
            {
                respose.AddError(nameof(semesterLevel), "This level has no courses.");
                return NotFound(respose);
            }

            respose.Data = coursesToGet;

            return Ok(response)
        }
    }
}