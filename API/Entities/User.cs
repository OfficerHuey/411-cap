using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class AppUser
    {
        [Key] //pk
        public int Id { get; set; }

        [Required]
        public string UserName { get; set; } //admin login ID

        //never store the actual password
        //creates hash to protect the sensitive information it contains on students
        public byte[] PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }

        public string Role { get; set; } = "Admin"; //default role
    }
}