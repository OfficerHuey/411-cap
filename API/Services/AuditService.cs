using NursingScheduler.API.Data;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Services
{
    public interface IAuditService
    {
        Task LogChange(string entityType, int entityId, string action, string performedBy, string? changes = null, int? semesterId = null);
    }

    public class AuditService : IAuditService
    {
        private readonly DataContext _context;

        public AuditService(DataContext context) => _context = context;

        //record a change to the audit log
        public async Task LogChange(string entityType, int entityId, string action, string performedBy, string? changes = null, int? semesterId = null)
        {
            _context.ChangeLogs.Add(new ChangeLog
            {
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                Changes = changes,
                PerformedBy = performedBy,
                SemesterId = semesterId,
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
}
