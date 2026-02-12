using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.DTOs.Auth
{
    //handles setup of admin acct
    public class RegisterDto
    {
        //username admin uses to log in
        [Required]
        public required string Username { get; set; }

        //password - planning to hash it before storing it(maybe) but for now yes
        [Required]
        [StringLength(20, MinimumLength = 6)]
        public required string Password { get; set; }
    }
}