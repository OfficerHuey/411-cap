using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Auth
{
    //returned by GET /api/auth/me
    public class ProfileDto
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public string? DisplayName { get; set; }
        public required string Role { get; set; }
        public required string DefaultLandingPage { get; set; }
        public required string ThemePreference { get; set; }
    }

    //accepted by PUT /api/auth/me
    public class UpdateProfileDto
    {
        [StringLength(50)]
        public string? DisplayName { get; set; }

        public string? DefaultLandingPage { get; set; }

        public string? ThemePreference { get; set; }
    }

    //POST /api/auth/forgot-password
    public class ForgotPasswordDto
    {
        [Required]
        public required string Email { get; set; }
    }

    //POST /api/auth/reset-password
    public class ResetPasswordDto
    {
        [Required]
        public required string Token { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 12)]
        public required string NewPassword { get; set; }
    }
}
