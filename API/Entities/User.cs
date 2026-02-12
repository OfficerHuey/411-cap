using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class AppUser
    {
        //pk
        public int Id { get; set; }

    
        public required string UserName { get; set; } //admin login ID

        //never store the actual password
        //creates hash to protect the sensitive information it contains on students
        public required byte[] PasswordHash { get; set; }
        public required byte[] PasswordSalt { get; set; }

        public string Role { get; set; } = "Admin"; //default role
    }
}