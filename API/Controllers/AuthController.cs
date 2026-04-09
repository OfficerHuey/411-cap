using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Auth;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;

        public AuthController(DataContext context, ITokenService tokenService, IEmailService emailService)
        {
            _context = context;
            _tokenService = tokenService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            //check if username already exists
            if (await _context.Users.AnyAsync(x => x.UserName == registerDto.Username.ToLower()))
                return BadRequest("username is taken");

            //create password hash using hmac
            using var hmac = new HMACSHA512();

            var user = new AppUser
            {
                UserName = registerDto.Username.ToLower(),
                PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(registerDto.Password)),
                PasswordSalt = hmac.Key,
                Role = "Admin"
            };

            //save to db
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserDto
            {
                Username = user.UserName,
                Token = _tokenService.CreateToken(user),
                Role = user.Role,
                DisplayName = user.DisplayName
            };
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            //find user by username
            var user = await _context.Users
                .SingleOrDefaultAsync(x => x.UserName == loginDto.Username.ToLower());

            if (user == null) return Unauthorized("invalid username");

            //verify password hash
            using var hmac = new HMACSHA512(user.PasswordSalt);
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));

            for (int i = 0; i < computedHash.Length; i++)
            {
                if (computedHash[i] != user.PasswordHash[i]) return Unauthorized("invalid password");
            }

            //8 hours default, 30 days if remember device
            var expiryHours = loginDto.RememberDevice ? 720 : 8;

            return new UserDto
            {
                Username = user.UserName,
                Token = _tokenService.CreateToken(user, expiryHours),
                Role = user.Role,
                DisplayName = user.DisplayName
            };
        }

        //get current user profile
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ProfileDto>> GetProfile()
        {
            var username = User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value;
            if (username == null) return Unauthorized();

            var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == username);
            if (user == null) return Unauthorized();

            return new ProfileDto
            {
                Id = user.Id,
                Username = user.UserName,
                DisplayName = user.DisplayName,
                Role = user.Role,
                DefaultLandingPage = user.DefaultLandingPage.ToString(),
                ThemePreference = user.ThemePreference.ToString()
            };
        }

        //update current user profile
        [Authorize]
        [HttpPut("me")]
        public async Task<ActionResult<ProfileDto>> UpdateProfile(UpdateProfileDto dto)
        {
            var username = User.FindFirst(JwtRegisteredClaimNames.NameId)?.Value;
            if (username == null) return Unauthorized();

            var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == username);
            if (user == null) return Unauthorized();

            if (dto.DisplayName != null)
                user.DisplayName = dto.DisplayName;

            if (dto.DefaultLandingPage != null)
            {
                if (!Enum.TryParse<LandingPage>(dto.DefaultLandingPage, true, out var lp))
                    return BadRequest("invalid landing page value");
                user.DefaultLandingPage = lp;
            }

            if (dto.ThemePreference != null)
            {
                if (!Enum.TryParse<ThemePreference>(dto.ThemePreference, true, out var tp))
                    return BadRequest("invalid theme preference value");
                user.ThemePreference = tp;
            }

            await _context.SaveChangesAsync();

            return new ProfileDto
            {
                Id = user.Id,
                Username = user.UserName,
                DisplayName = user.DisplayName,
                Role = user.Role,
                DefaultLandingPage = user.DefaultLandingPage.ToString(),
                ThemePreference = user.ThemePreference.ToString()
            };
        }

        //request a password reset — always returns 200 to prevent email enumeration
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            //treat username field as email — find user by username match
            var user = await _context.Users
                .SingleOrDefaultAsync(x => x.UserName == dto.Email.ToLower());

            if (user != null)
            {
                //generate a cryptographic token
                var tokenBytes = RandomNumberGenerator.GetBytes(32);
                var tokenString = Convert.ToBase64String(tokenBytes)
                    .Replace("+", "-").Replace("/", "_").TrimEnd('=');

                //hash the token before storing
                var hash = SHA256.HashData(Encoding.UTF8.GetBytes(tokenString));

                var resetToken = new PasswordResetToken
                {
                    UserId = user.Id,
                    TokenHash = hash,
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                };

                _context.PasswordResetTokens.Add(resetToken);
                await _context.SaveChangesAsync();

                //send the raw token via email
                await _emailService.SendPasswordResetAsync(user.UserName, tokenString);
            }

            //always return ok to prevent email enumeration
            return Ok(new { message = "If an account with that email exists, a reset link has been sent." });
        }

        //reset password with token
        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword(ResetPasswordDto dto)
        {
            //hash the incoming token to match against stored hash
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(dto.Token));

            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash.SequenceEqual(hash) &&
                    t.UsedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow);

            if (resetToken == null)
                return BadRequest("Invalid or expired reset token.");

            //update password
            using var hmac = new HMACSHA512();
            resetToken.User.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.NewPassword));
            resetToken.User.PasswordSalt = hmac.Key;

            //mark token as used
            resetToken.UsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully." });
        }
    }
}
