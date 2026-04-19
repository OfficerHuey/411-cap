using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Instructor;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InstructorsController : ControllerBase
    {
        private readonly DataContext _context;

        public InstructorsController(DataContext context)
        {
            _context = context;
        }

        //get all instructors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InstructorDto>>> GetInstructors()
        {
            var instructors = await _context.Instructors
                .Select(i => new InstructorDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Email = i.Email,
                    Type = i.Type,
                    Phone = i.Phone,
                    TotalWorkloadHours = 0
                })
                .ToListAsync();

            return Ok(instructors);
        }

        //get instructor with assigned sections
        [HttpGet("{id}")]
        public async Task<ActionResult<InstructorDto>> GetInstructor(int id)
        {
            var instructor = await _context.Instructors
                .Include(i => i.Sections)
                    .ThenInclude(s => s.Course)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null) return NotFound();

            return Ok(new InstructorDto
            {
                Id = instructor.Id,
                Name = instructor.Name,
                Email = instructor.Email,
                Type = instructor.Type,
                Phone = instructor.Phone,
                TotalWorkloadHours = (double)instructor.Sections.Sum(s => WorkloadCalculator.Calculate(s.Course!))
            });
        }

        //create a new instructor
        [HttpPost]
        public async Task<ActionResult<InstructorDto>> CreateInstructor(CreateInstructorDto createDto)
        {
            var instructor = new Instructor
            {
                Name = createDto.Name,
                Email = createDto.Email,
                Type = createDto.Type,
                Phone = createDto.Phone
            };

            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();

            return Ok(new InstructorDto
            {
                Id = instructor.Id,
                Name = instructor.Name,
                Email = instructor.Email,
                Type = instructor.Type,
                Phone = instructor.Phone,
                TotalWorkloadHours = 0
            });
        }

        //update instructor details
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateInstructor(int id, CreateInstructorDto updateDto)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null) return NotFound();

            instructor.Name = updateDto.Name;
            instructor.Email = updateDto.Email;
            instructor.Type = updateDto.Type;
            instructor.Phone = updateDto.Phone;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        //delete an instructor — clears assignments from sections and join table
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteInstructor(int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null) return NotFound();

            //clear the FK on any sections assigned to this instructor
            var assignedSections = await _context.Sections
                .Where(s => s.InstructorId == id)
                .ToListAsync();
            foreach (var section in assignedSections)
                section.InstructorId = null;

            //remove join table entries
            var joinRows = await _context.SectionInstructors
                .Where(si => si.InstructorId == id)
                .ToListAsync();
            _context.SectionInstructors.RemoveRange(joinRows);

            _context.Instructors.Remove(instructor);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        //get instructor workload for a specific semester
        [HttpGet("{id}/workload")]
        public async Task<ActionResult<InstructorWorkloadDto>> GetWorkload(int id, [FromQuery] int semesterId)
        {
            var instructor = await _context.Instructors
                .Include(i => i.Sections.Where(s => s.SemesterId == semesterId))
                    .ThenInclude(s => s.Course)
                .Include(i => i.SectionInstructors.Where(si => si.Section.SemesterId == semesterId))
                    .ThenInclude(si => si.Section)
                        .ThenInclude(s => s.Course)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (instructor == null) return NotFound();

            //build lookup of overrides from the join table
            var overrides = instructor.SectionInstructors
                .ToDictionary(si => si.SectionId, si => si);

            //use sections from the simple FK (primary assignments)
            var sectionWorkloads = new List<SectionWorkloadDto>();
            foreach (var section in instructor.Sections)
            {
                var calculated = WorkloadCalculator.Calculate(section.Course!);
                overrides.TryGetValue(section.Id, out var joinRow);
                var overrideValue = joinRow?.WorkloadOverride;
                var applied = overrideValue ?? calculated;

                sectionWorkloads.Add(new SectionWorkloadDto
                {
                    SectionId = section.Id,
                    CourseCode = section.Course!.Code,
                    SectionNumber = section.SectionNumber,
                    CalculatedWorkload = calculated,
                    OverrideWorkload = overrideValue,
                    AppliedWorkload = applied,
                    IsOverridden = overrideValue.HasValue
                });
            }

            //also include sections only in join table (additional instructor assignments)
            foreach (var si in instructor.SectionInstructors)
            {
                if (instructor.Sections.Any(s => s.Id == si.SectionId)) continue;

                var calculated = WorkloadCalculator.Calculate(si.Section.Course!);
                var applied = si.WorkloadOverride ?? calculated;

                sectionWorkloads.Add(new SectionWorkloadDto
                {
                    SectionId = si.SectionId,
                    CourseCode = si.Section.Course!.Code,
                    SectionNumber = si.Section.SectionNumber,
                    CalculatedWorkload = calculated,
                    OverrideWorkload = si.WorkloadOverride,
                    AppliedWorkload = applied,
                    IsOverridden = si.WorkloadOverride.HasValue
                });
            }

            return Ok(new InstructorWorkloadDto
            {
                InstructorId = instructor.Id,
                InstructorName = instructor.Name,
                SemesterId = semesterId,
                TotalWorkload = sectionWorkloads.Sum(s => s.AppliedWorkload),
                Sections = sectionWorkloads
            });
        }

        //set or clear a workload override for an instructor on a section
        [HttpPut("sections/{sectionId}/instructors/{instructorId}/workload")]
        public async Task<ActionResult> SetWorkloadOverride(int sectionId, int instructorId, [FromBody] SetWorkloadOverrideDto dto)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null) return NotFound("Section not found");

            var instructor = await _context.Instructors.FindAsync(instructorId);
            if (instructor == null) return NotFound("Instructor not found");

            //find or create the join row
            var joinRow = await _context.SectionInstructors
                .FirstOrDefaultAsync(si => si.SectionId == sectionId && si.InstructorId == instructorId);

            if (joinRow == null)
            {
                joinRow = new SectionInstructor
                {
                    SectionId = sectionId,
                    InstructorId = instructorId,
                    WorkloadOverride = dto.WorkloadOverride,
                    WorkloadOverrideReason = dto.Reason
                };
                _context.SectionInstructors.Add(joinRow);
            }
            else
            {
                joinRow.WorkloadOverride = dto.WorkloadOverride;
                joinRow.WorkloadOverrideReason = dto.Reason;
            }

            await _context.SaveChangesAsync();
            return Ok(new { joinRow.SectionId, joinRow.InstructorId, joinRow.WorkloadOverride, joinRow.WorkloadOverrideReason });
        }
    }
}
