namespace NursingScheduler.API.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetAsync(string toEmail, string resetToken);
    }
}
