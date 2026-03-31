using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConflictsController : ControllerBase
    {
        private readonly IConflictService _conflictService;

        public ConflictsController(IConflictService conflictService)
        {
            _conflictService = conflictService;
        }

        //check conflicts before placing a section
        [HttpPost("check")]
        public async Task<ActionResult<List<Services.ConflictResult>>> CheckConflicts(CreateSectionDto dto)
        {
            var conflicts = await _conflictService.CheckSectionPlacement(dto);
            return Ok(conflicts);
        }
    }
}
