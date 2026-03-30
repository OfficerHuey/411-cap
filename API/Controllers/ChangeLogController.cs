using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChangeLogController : ControllerBase
    {
        private readonly DataContext _context;

        public ChangeLogController(DataContext context)
        {
            _context = context;
        }

        //get audit log entries filtered by semester and/or entity type
        [HttpGet]
        public async Task<ActionResult> GetChangeLogs([FromQuery] int? semesterId, [FromQuery] string? entityType)
        {
            var query = _context.ChangeLogs.AsQueryable();

            if (semesterId.HasValue)
                query = query.Where(c => c.SemesterId == semesterId);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(c => c.EntityType == entityType);

            var logs = await query
                .OrderByDescending(c => c.Timestamp)
                .Select(c => new
                {
                    c.Id,
                    c.EntityType,
                    c.EntityId,
                    c.Action,
                    c.Changes,
                    c.PerformedBy,
                    c.Timestamp,
                    c.SemesterId
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
