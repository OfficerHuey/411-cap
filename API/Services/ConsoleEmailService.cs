using NursingScheduler.API.Interfaces;

namespace NursingScheduler.API.Services
{
    //logs emails to console for development — swap with smtp in production
    public class ConsoleEmailService : IEmailService
    {
        public Task SendPasswordResetAsync(string toEmail, string resetToken)
        {
            Console.WriteLine("══════════════════════════════════════════════");
            Console.WriteLine("  PASSWORD RESET EMAIL");
            Console.WriteLine($"  To: {toEmail}");
            Console.WriteLine($"  Token: {resetToken}");
            Console.WriteLine($"  Link: http://localhost:5173/reset-password?token={resetToken}");
            Console.WriteLine("══════════════════════════════════════════════");
            return Task.CompletedTask;
        }
    }
}
