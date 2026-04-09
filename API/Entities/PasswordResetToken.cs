using System.ComponentModel.DataAnnotations;

namespace NursingScheduler.API.Entities
{
    public class PasswordResetToken
    {
        public int Id { get; set; }

        //which user requested the reset
        public int UserId { get; set; }
        public AppUser User { get; set; } = null!;

        //sha256 hash of the token sent via email
        public required byte[] TokenHash { get; set; }

        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
    }
}
