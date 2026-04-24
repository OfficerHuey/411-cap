using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Messages;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;

namespace NursingScheduler.API.Controllers
{
    //user directory lookup — powers the "new conversation" picker on the
    //messaging page. kept minimal: only the fields needed to render avatars
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly DataContext _context;

        public UsersController(DataContext context)
        {
            _context = context;
        }

        private static string InitialsOf(AppUser u)
        {
            var source = !string.IsNullOrWhiteSpace(u.DisplayName) ? u.DisplayName! : u.UserName;
            var parts = source.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "?";
            if (parts.Length == 1) return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            return ($"{parts[0][0]}{parts[^1][0]}").ToUpper();
        }

        //users that can be messaged — everyone except the caller. filterable
        //by free-text search against username + display name
        [HttpGet("available")]
        public async Task<ActionResult<List<AvailableUserDto>>> Available([FromQuery] string? search = null)
        {
            var me = User.GetUsername();

            var q = _context.Users.AsQueryable();
            if (!string.IsNullOrWhiteSpace(me))
                q = q.Where(u => u.UserName != me);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                q = q.Where(u =>
                    u.UserName.ToLower().Contains(s) ||
                    (u.DisplayName != null && u.DisplayName.ToLower().Contains(s)));
            }

            var list = await q
                .OrderBy(u => u.DisplayName ?? u.UserName)
                .Take(200)
                .ToListAsync();

            return Ok(list.Select(u => new AvailableUserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                DisplayName = string.IsNullOrWhiteSpace(u.DisplayName) ? u.UserName : u.DisplayName!,
                Initials = InitialsOf(u),
                Role = u.Role,
            }).ToList());
        }
    }
}
