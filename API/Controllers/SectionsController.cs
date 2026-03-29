using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Section;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SectionsController : ControllerBase
    {
        private readonly DataContext _context;

        public SectionsController(DataContext context)
        {
            _context = context;
        }

        // handles the drop event
        //checks if section exists to link it, or creates a new one
        [HttpPost]
        public async Task<ActionResult<SectionDto>> CreateOrLinkSection(CreateSectionDto createDto)
        {
            //step 1 check if this specific class section already exists 
            //(nurs 339, section 01)
            var existingSection = await _context.Sections
                .Include(s => s.Course)
                .FirstOrDefaultAsync(s => 
                    s.CourseId == createDto.CourseId && 
                    s.SectionNumber == createDto.SectionNumber &&
                    s.SemesterId == createDto.SemesterId);

            Section sectionToLink;

            if (existingSection != null)
            {
                //it exists, so we just link to it (shared lecture logic)
                sectionToLink = existingSection;
            }
            else
            {
                //it doesn't exist, create a new one
                sectionToLink = new Section
                {
                    SectionNumber = createDto.SectionNumber,
                    DayOfWeek = createDto.DayOfWeek,
                    StartTime = createDto.StartTime,
                    EndTime = createDto.EndTime,
                    Notes = createDto.Notes,
                    DateRange = createDto.DateRange,
                    Term = createDto.Term,
                    TermStartDate = createDto.TermStartDate,
                    TermEndDate = createDto.TermEndDate,
                    RoomId = createDto.RoomId,
                    CourseId = createDto.CourseId,
                    SemesterId = createDto.SemesterId
                };
                _context.Sections.Add(sectionToLink);
                //save now to get the id for the link
                await _context.SaveChangesAsync(); 
            }

            //step 2create the bridge link to the schedule bucket
            var link = new ScheduleSection
            {
                ScheduleId = createDto.ScheduleId,
                SectionId = sectionToLink.Id
            };

            _context.ScheduleSections.Add(link);
            await _context.SaveChangesAsync();

            //return the dto for the frontend to render the block
            //fetch course and room details if needed
            if (sectionToLink.Course == null)
                sectionToLink.Course = await _context.Courses.FindAsync(sectionToLink.CourseId);
            if (sectionToLink.RoomId.HasValue && sectionToLink.Room == null)
                sectionToLink.Room = await _context.Rooms.FindAsync(sectionToLink.RoomId);

            return Ok(new SectionDto
            {
                Id = sectionToLink.Id,
                SectionNumber = sectionToLink.SectionNumber,
                DayOfWeek = sectionToLink.DayOfWeek,
                StartTime = sectionToLink.StartTime,
                EndTime = sectionToLink.EndTime,
                Notes = sectionToLink.Notes,
                DateRange = sectionToLink.DateRange,
                Term = sectionToLink.Term,
                TermStartDate = sectionToLink.TermStartDate,
                TermEndDate = sectionToLink.TermEndDate,
                RoomId = sectionToLink.RoomId,
                RoomNumber = sectionToLink.Room?.RoomNumber,
                RoomBuilding = sectionToLink.Room?.Building,
                CourseId = sectionToLink.CourseId,
                CourseCode = sectionToLink.Course!.Code,
                CourseName = sectionToLink.Course!.Name,
                CourseType = sectionToLink.Course!.DefaultType
            });
        }
        // get api/Sections/semester/1
        // Returns EVERY section in the semester for the Viewer/ghost track that will be visible
        //for the client on the calendar. SHows the course times put in so far so that they don;t double book
        [HttpGet("semester/{semesterId}")]
        public async Task<ActionResult<IEnumerable<SectionDto>>> GetAllSectionsForSemester(int semesterId)
        {
            var sections = await _context.Sections
                .Include(s => s.Course)
                .Include(s => s.Room)
                .Where(s => s.SemesterId == semesterId)
                .Select(s => new SectionDto
                {
                    Id = s.Id,
                    SectionNumber = s.SectionNumber,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Notes = s.Notes,
                    DateRange = s.DateRange,
                    Term = s.Term,
                    TermStartDate = s.TermStartDate,
                    TermEndDate = s.TermEndDate,
                    RoomId = s.RoomId,
                    RoomNumber = s.Room != null ? s.Room.RoomNumber : null,
                    RoomBuilding = s.Room != null ? s.Room.Building : null,
                    CourseId = s.CourseId,
                    CourseCode = s.Course!.Code,
                    CourseName = s.Course.Name,
                    CourseType = s.Course.DefaultType
                })
                .ToListAsync();

            return Ok(sections);
        }

        //update time or notes (dragging to a new time)
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateSection(int id, UpdateSectionDto updateDto)
        {
            var section = await _context.Sections.FindAsync(id);
            if (section == null) return NotFound();

            // update fields if they are provided
            if (updateDto.SectionNumber != null) section.SectionNumber = updateDto.SectionNumber;
            if (updateDto.DayOfWeek.HasValue) section.DayOfWeek = updateDto.DayOfWeek;
            if (updateDto.StartTime.HasValue) section.StartTime = updateDto.StartTime;
            if (updateDto.EndTime.HasValue) section.EndTime = updateDto.EndTime;
            if (updateDto.Notes != null) section.Notes = updateDto.Notes;
            if (updateDto.DateRange != null) section.DateRange = updateDto.DateRange;
            if (updateDto.Term.HasValue) section.Term = updateDto.Term;
            if (updateDto.TermStartDate.HasValue) section.TermStartDate = updateDto.TermStartDate;
            if (updateDto.TermEndDate.HasValue) section.TermEndDate = updateDto.TermEndDate;
            if (updateDto.RoomId.HasValue) section.RoomId = updateDto.RoomId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        //delete a section (remove from calendar)
        //this might need logic to only delete the link, not the whole section if shared --reminder
        [HttpDelete("{sectionId}/schedule/{scheduleId}")]
        public async Task<ActionResult> RemoveSectionFromSchedule(int sectionId, int scheduleId)
        {
            var link = await _context.ScheduleSections
                .FirstOrDefaultAsync(ss => ss.SectionId == sectionId && ss.ScheduleId == scheduleId);

            if (link == null) return NotFound();

            _context.ScheduleSections.Remove(link);
            await _context.SaveChangesAsync();

            //check if section has 0 links left and delete it entirely?
            //keeping it simple for now lol

            return NoContent();
        }
    }
}