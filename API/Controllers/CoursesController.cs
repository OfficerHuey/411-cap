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

        [HttpGet("{semesterLevel}")]
        public IActionResult GetPallete(int semesterLevel)
        {
            var respose = new Response();

            var coursesToGet = _dataContext
                .Set<Courses>()
                .Where(Courses => (Courses.SemesterLevel == semesterLevel))
                .Select(Courses => new CourseDto
                {
                    Id = Courses.Id,
                    Code = Courses.Code,
                    Name = Courses.Name,
                    SemesterLevel = Courses.SemesterLevel,
                    CourseType = Courses.CourseType
                }
                ).ToList();

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