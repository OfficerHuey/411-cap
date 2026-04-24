using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NursingScheduler.API.Data;
using NursingScheduler.API.DTOs.Files;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Extensions;
using NursingScheduler.API.Services;

namespace NursingScheduler.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly FileStorageOptions _storage;
        private readonly IWebHostEnvironment _env;

        public FilesController(
            DataContext context,
            IOptions<FileStorageOptions> storage,
            IWebHostEnvironment env)
        {
            _context = context;
            _storage = storage.Value;
            _env = env;
        }

        //root directory where files live on disk, resolved once per request.
        //relative paths are anchored to the app's content root so the same
        //config works from both dotnet run and IIS deployment
        private string ResolveBaseDirectory()
        {
            var cfg = _storage.BasePath;
            var full = Path.IsPathRooted(cfg)
                ? cfg
                : Path.Combine(_env.ContentRootPath, cfg);
            Directory.CreateDirectory(full);
            return full;
        }

        //project an entity to its client DTO
        private static AppFileDto ToDto(AppFile f)
        {
            return new AppFileDto
            {
                Id = f.Id,
                FileName = f.FileName,
                OriginalFileName = f.OriginalFileName,
                ContentType = f.ContentType,
                FileSizeBytes = f.FileSizeBytes,
                Title = f.Title,
                Description = f.Description,
                UploadedByName = f.UploadedBy?.DisplayName
                    ?? f.UploadedBy?.UserName
                    ?? "Unknown",
                UploadedAt = f.UploadedAt,
                LastAccessedAt = f.LastAccessedAt,
            };
        }

        //lookup the authenticated user's row. returns null for unauthenticated
        //callers (shouldn't happen with [Authorize] but defensive anyway)
        private async Task<AppUser?> GetCurrentUserAsync()
        {
            var username = User.GetUsername();
            if (string.IsNullOrEmpty(username)) return null;
            return await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == username);
        }

        //paged + searchable listing
        [HttpGet]
        public async Task<ActionResult<FilesPageResponseDto>> List(
            [FromQuery] string? search = null,
            [FromQuery] string sortBy = "uploadedAt",
            [FromQuery] string sortDir = "desc",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var query = _context.AppFiles
                .Include(f => f.UploadedBy)
                .Where(f => !f.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(f =>
                    f.OriginalFileName.ToLower().Contains(s) ||
                    (f.Title != null && f.Title.ToLower().Contains(s)) ||
                    (f.Description != null && f.Description.ToLower().Contains(s)));
            }

            var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy.ToLower() switch
            {
                "filename" => desc
                    ? query.OrderByDescending(f => f.OriginalFileName)
                    : query.OrderBy(f => f.OriginalFileName),
                "filesize" => desc
                    ? query.OrderByDescending(f => f.FileSizeBytes)
                    : query.OrderBy(f => f.FileSizeBytes),
                _ => desc
                    ? query.OrderByDescending(f => f.UploadedAt)
                    : query.OrderBy(f => f.UploadedAt),
            };

            var total = await query.CountAsync();
            var rows = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new FilesPageResponseDto
            {
                Items = rows.Select(ToDto).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            });
        }

        //metadata by id
        [HttpGet("{id:int}")]
        public async Task<ActionResult<AppFileDto>> Get(int id)
        {
            var file = await _context.AppFiles
                .Include(f => f.UploadedBy)
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (file == null) return NotFound();
            return Ok(ToDto(file));
        }

        //raw bytes with attachment disposition — forces a download in the browser
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var file = await _context.AppFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (file == null) return NotFound();

            var fullPath = Path.Combine(ResolveBaseDirectory(), file.StoragePath);
            if (!System.IO.File.Exists(fullPath))
                return NotFound("File missing on disk");

            file.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return File(stream, file.ContentType, file.OriginalFileName);
        }

        //raw bytes with inline disposition — browser renders it (pdf, image,
        //text) inside an iframe/img/etc without triggering a download
        [HttpGet("{id:int}/preview")]
        public async Task<IActionResult> Preview(int id)
        {
            var file = await _context.AppFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (file == null) return NotFound();

            var fullPath = Path.Combine(ResolveBaseDirectory(), file.StoragePath);
            if (!System.IO.File.Exists(fullPath))
                return NotFound("File missing on disk");

            file.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            //explicit inline disposition, browser-assigned filename for saves
            Response.Headers.ContentDisposition =
                $"inline; filename=\"{file.OriginalFileName}\"";
            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return File(stream, file.ContentType);
        }

        //multipart upload — validates size/extension, writes to disk, creates row
        [HttpPost]
        [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
        public async Task<ActionResult<AppFileDto>> Upload(
            IFormFile file,
            [FromForm] string? title = null,
            [FromForm] string? description = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            if (file.Length > _storage.MaxFileSizeBytes)
                return BadRequest($"File exceeds the {_storage.MaxFileSizeMB} MB limit");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || !_storage.AllowedExtensions
                    .Any(e => e.Equals(ext, StringComparison.OrdinalIgnoreCase)))
            {
                var allowed = string.Join(", ", _storage.AllowedExtensions);
                return BadRequest($"File type '{ext}' is not allowed. Allowed: {allowed}");
            }

            var currentUser = await GetCurrentUserAsync();
            if (currentUser == null) return Unauthorized();

            //use a guid prefix to prevent disk collisions. keep original name
            //as a suffix for easier on-disk diagnostics
            var safeOriginal = Path.GetFileName(file.FileName);
            var diskName = $"{Guid.NewGuid():N}_{safeOriginal}";
            var baseDir = ResolveBaseDirectory();
            var diskFullPath = Path.Combine(baseDir, diskName);

            using (var fs = new FileStream(diskFullPath, FileMode.CreateNew))
            {
                await file.CopyToAsync(fs);
            }

            var entity = new AppFile
            {
                FileName = diskName,
                OriginalFileName = safeOriginal,
                ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                    ? "application/octet-stream"
                    : file.ContentType,
                FileSizeBytes = file.Length,
                StoragePath = diskName,
                Title = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
                UploadedByUserId = currentUser.Id,
                UploadedAt = DateTime.UtcNow,
            };

            _context.AppFiles.Add(entity);
            await _context.SaveChangesAsync();

            //eager-load so ToDto fills UploadedByName on the return payload
            entity.UploadedBy = currentUser;
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, ToDto(entity));
        }

        //edit title/description only — not the file content itself
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateFileDto dto)
        {
            var file = await _context.AppFiles
                .Include(f => f.UploadedBy)
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (file == null) return NotFound();

            file.Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim();
            file.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            await _context.SaveChangesAsync();

            return Ok(ToDto(file));
        }

        //soft delete only — preserves the row and the disk bytes so we can
        //add an un-delete flow later without restoring from backup
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var file = await _context.AppFiles
                .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (file == null) return NotFound();

            file.IsDeleted = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
