using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Auth
{
    //data sent when admin attempts to log in
    public class LoginDto
    {
        //username in login form
        [Required]
        public required string Username { get; set; }

        //password in log in form
        [Required]
        public required string Password { get; set; }
    }
}