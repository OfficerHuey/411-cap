using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Services
{
    //severity levels for conflict results
    public enum ConflictSeverity
    {
        Info,
        Warning,
        Error
    }

    //result object returned by conflict checks
    public class ConflictResult
    {
        public ConflictSeverity Severity { get; set; }
        public required string Message { get; set; }
        public string? Details { get; set; }
        public int? ConflictingSectionId { get; set; }
    }

    //wrapper dto for section creation with conflict warnings
    public class SectionWithConflictsDto
    {
        public SectionDto Section { get; set; } = null!;
        public List<ConflictResult> Conflicts { get; set; } = new();
    }

    public interface IConflictService
    {
        Task<List<ConflictResult>> CheckConflicts(int sectionId, int scheduleId, int semesterId);
        Task<List<ConflictResult>> CheckSectionPlacement(CreateSectionDto dto);
    }

    public class ConflictService : IConflictService
    {
        private readonly DataContext _context;

        public ConflictService(DataContext context)
        {
            _context = context;
        }

        //check conflicts for an existing section being linked to a schedule
        public async Task<List<ConflictResult>> CheckConflicts(int sectionId, int scheduleId, int semesterId)
        {
            var conflicts = new List<ConflictResult>();

            var section = await _context.Sections
                .Include(s => s.Course)
                .Include(s => s.Room)
                .FirstOrDefaultAsync(s => s.Id == sectionId);

            if (section == null) return conflicts;

            var allSections = await _context.Sections
                .Include(s => s.Course)
                .Include(s => s.Room)
                .Include(s => s.ScheduleSections)
                .Where(s => s.SemesterId == semesterId && s.Id != sectionId)
                .ToListAsync();

            //get sections already in target schedule
            var scheduleSections = allSections
                .Where(s => s.ScheduleSections.Any(ss => ss.ScheduleId == scheduleId))
                .ToList();

            CheckRoomConflicts(section, allSections, conflicts);
            CheckScheduleOverlap(section, scheduleSections, conflicts);
            CheckInstructorConflicts(section, allSections, conflicts);
            await CheckCampusTravelConflicts(section, scheduleSections, scheduleId, conflicts);
            await CheckCapacityWarning(scheduleId, conflicts);
            CheckSharedSectionInfo(section, allSections, conflicts);

            return conflicts;
        }

        //check conflicts before creating a new section
        public async Task<List<ConflictResult>> CheckSectionPlacement(CreateSectionDto dto)
        {
            var conflicts = new List<ConflictResult>();

            if (!dto.DayOfWeek.HasValue || !dto.StartTime.HasValue || !dto.EndTime.HasValue)
                return conflicts;

            var allSections = await _context.Sections
                .Include(s => s.Course)
                .Include(s => s.Room)
                .Include(s => s.ScheduleSections)
                .Where(s => s.SemesterId == dto.SemesterId)
                .ToListAsync();

            //get sections in the target schedule
            var scheduleSections = allSections
                .Where(s => s.ScheduleSections.Any(ss => ss.ScheduleId == dto.ScheduleId))
                .ToList();

            //build a temporary section for comparison
            var tempSection = new Section
            {
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                RoomId = dto.RoomId,
                InstructorId = dto.InstructorId,
                Term = dto.Term,
                CourseId = dto.CourseId,
                SectionNumber = dto.SectionNumber
            };
            tempSection.Course = await _context.Courses.FindAsync(dto.CourseId);

            CheckRoomConflicts(tempSection, allSections, conflicts);
            CheckScheduleOverlap(tempSection, scheduleSections, conflicts);
            CheckInstructorConflicts(tempSection, allSections, conflicts);
            await CheckCampusTravelConflicts(tempSection, scheduleSections, dto.ScheduleId, conflicts);
            await CheckCapacityWarning(dto.ScheduleId, conflicts);
            CheckSharedSectionInfo(tempSection, allSections, conflicts);

            return conflicts;
        }

        //red: same room, same day, overlapping times, compatible terms
        private void CheckRoomConflicts(Section section, List<Section> allSections, List<ConflictResult> conflicts)
        {
            if (!section.RoomId.HasValue || !section.DayOfWeek.HasValue ||
                !section.StartTime.HasValue || !section.EndTime.HasValue) return;

            foreach (var other in allSections)
            {
                if (!other.RoomId.HasValue || other.RoomId != section.RoomId) continue;
                if (!other.DayOfWeek.HasValue || other.DayOfWeek != section.DayOfWeek) continue;
                if (!other.StartTime.HasValue || !other.EndTime.HasValue) continue;
                if (!AreTermsCompatible(section.Term, other.Term)) continue;
                if (!TimesOverlap(section.StartTime.Value, section.EndTime.Value, other.StartTime.Value, other.EndTime.Value)) continue;

                conflicts.Add(new ConflictResult
                {
                    Severity = ConflictSeverity.Error,
                    Message = "Room double-booking detected",
                    Details = $"Room is already booked by {other.Course?.Code}-{other.SectionNumber} on {other.DayOfWeek} {other.StartTime:hh\\:mm}-{other.EndTime:hh\\:mm}",
                    ConflictingSectionId = other.Id
                });
            }
        }

        //red: schedule already has a section at overlapping time
        private void CheckScheduleOverlap(Section section, List<Section> scheduleSections, List<ConflictResult> conflicts)
        {
            if (!section.DayOfWeek.HasValue || !section.StartTime.HasValue || !section.EndTime.HasValue) return;

            foreach (var other in scheduleSections)
            {
                if (!other.DayOfWeek.HasValue || other.DayOfWeek != section.DayOfWeek) continue;
                if (!other.StartTime.HasValue || !other.EndTime.HasValue) continue;
                if (!AreTermsCompatible(section.Term, other.Term)) continue;
                if (!TimesOverlap(section.StartTime.Value, section.EndTime.Value, other.StartTime.Value, other.EndTime.Value)) continue;

                conflicts.Add(new ConflictResult
                {
                    Severity = ConflictSeverity.Error,
                    Message = "Schedule time overlap",
                    Details = $"This schedule already has {other.Course?.Code}-{other.SectionNumber} on {other.DayOfWeek} {other.StartTime:hh\\:mm}-{other.EndTime:hh\\:mm}",
                    ConflictingSectionId = other.Id
                });
            }
        }

        //red: instructor already teaching at overlapping time
        private void CheckInstructorConflicts(Section section, List<Section> allSections, List<ConflictResult> conflicts)
        {
            if (!section.InstructorId.HasValue || !section.DayOfWeek.HasValue ||
                !section.StartTime.HasValue || !section.EndTime.HasValue) return;

            foreach (var other in allSections)
            {
                if (!other.InstructorId.HasValue || other.InstructorId != section.InstructorId) continue;
                if (!other.DayOfWeek.HasValue || other.DayOfWeek != section.DayOfWeek) continue;
                if (!other.StartTime.HasValue || !other.EndTime.HasValue) continue;
                if (!AreTermsCompatible(section.Term, other.Term)) continue;
                if (!TimesOverlap(section.StartTime.Value, section.EndTime.Value, other.StartTime.Value, other.EndTime.Value)) continue;

                conflicts.Add(new ConflictResult
                {
                    Severity = ConflictSeverity.Error,
                    Message = "Instructor double-booking",
                    Details = $"Instructor is already assigned to {other.Course?.Code}-{other.SectionNumber} on {other.DayOfWeek} {other.StartTime:hh\\:mm}-{other.EndTime:hh\\:mm}",
                    ConflictingSectionId = other.Id
                });
            }
        }

        //yellow: back-to-back sections at different campuses within same schedule
        private async Task CheckCampusTravelConflicts(Section section, List<Section> scheduleSections, int scheduleId, List<ConflictResult> conflicts)
        {
            if (!section.RoomId.HasValue || !section.DayOfWeek.HasValue ||
                !section.StartTime.HasValue || !section.EndTime.HasValue) return;

            var sectionRoom = section.Room ?? await _context.Rooms.FindAsync(section.RoomId);
            if (sectionRoom == null) return;

            foreach (var other in scheduleSections)
            {
                if (!other.RoomId.HasValue || !other.DayOfWeek.HasValue ||
                    other.DayOfWeek != section.DayOfWeek ||
                    !other.StartTime.HasValue || !other.EndTime.HasValue) continue;

                var otherRoom = other.Room ?? await _context.Rooms.FindAsync(other.RoomId);
                if (otherRoom == null || otherRoom.Campus == sectionRoom.Campus) continue;

                //check if less than 60 min gap between sections
                var gap1 = (section.StartTime.Value - other.EndTime.Value).TotalMinutes;
                var gap2 = (other.StartTime.Value - section.EndTime.Value).TotalMinutes;
                var gap = Math.Min(Math.Abs(gap1), Math.Abs(gap2));

                if ((gap1 >= 0 && gap1 < 60) || (gap2 >= 0 && gap2 < 60))
                {
                    conflicts.Add(new ConflictResult
                    {
                        Severity = ConflictSeverity.Warning,
                        Message = "Campus travel conflict",
                        Details = $"Less than 60 min between {sectionRoom.Campus} and {otherRoom.Campus} campuses ({other.Course?.Code}-{other.SectionNumber})",
                        ConflictingSectionId = other.Id
                    });
                }
            }
        }

        //yellow: lab group nearing capacity
        private async Task CheckCapacityWarning(int scheduleId, List<ConflictResult> conflicts)
        {
            var schedule = await _context.Schedules
                .Include(s => s.Students)
                .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null) return;

            var capacity = schedule.Capacity;
            var count = schedule.Students.Count;

            if (count >= capacity - 1 && count <= capacity)
            {
                conflicts.Add(new ConflictResult
                {
                    Severity = ConflictSeverity.Warning,
                    Message = "Lab group nearing capacity",
                    Details = $"Schedule \"{schedule.Name}\" has {count}/{capacity} students"
                });
            }
        }

        //blue: shared section exists at different time
        private void CheckSharedSectionInfo(Section section, List<Section> allSections, List<ConflictResult> conflicts)
        {
            foreach (var other in allSections)
            {
                if (other.CourseId != section.CourseId) continue;
                if (other.SectionNumber != section.SectionNumber) continue;
                if (other.DayOfWeek == section.DayOfWeek &&
                    other.StartTime == section.StartTime &&
                    other.EndTime == section.EndTime) continue;

                conflicts.Add(new ConflictResult
                {
                    Severity = ConflictSeverity.Info,
                    Message = "Shared section exists at different time",
                    Details = $"Section {other.SectionNumber} already exists on {other.DayOfWeek} {other.StartTime:hh\\:mm}-{other.EndTime:hh\\:mm} — did you mean to link to it?",
                    ConflictingSectionId = other.Id
                });
                break;
            }
        }

        //two time ranges overlap if a_start < b_end and b_start < a_end
        private bool TimesOverlap(TimeSpan aStart, TimeSpan aEnd, TimeSpan bStart, TimeSpan bEnd)
        {
            return aStart < bEnd && bStart < aEnd;
        }

        //term1 + term2 do not conflict; all other combinations do
        private bool AreTermsCompatible(TermType? a, TermType? b)
        {
            var termA = a ?? TermType.Full;
            var termB = b ?? TermType.Full;

            if (termA == TermType.Term1 && termB == TermType.Term2) return false;
            if (termA == TermType.Term2 && termB == TermType.Term1) return false;

            return true;
        }
    }
}
