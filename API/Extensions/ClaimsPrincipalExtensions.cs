using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace NursingScheduler.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        //resilient username lookup — works whether claim mapping is on, off, or partial
        public static string? GetUsername(this ClaimsPrincipal principal)
        {
            return principal.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.Identity?.Name;
        }
    }
}
