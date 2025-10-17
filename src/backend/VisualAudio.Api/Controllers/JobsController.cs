using Microsoft.AspNetCore.Mvc;

using VisualAudio.Data.FileStorage;
using VisualAudio.Services.Extensions;
using VisualAudio.Services.Jobs;
using VisualAudio.Services.Jobs.Handlers;

namespace VisualAudio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly IJobStore _jobStore;
        private readonly IFileStorageService _fileStorageService;

        public JobsController(IJobStore jobStore, IFileStorageService fileStorageService)
        {
            _jobStore = jobStore;
            _fileStorageService = fileStorageService;
        }

        [HttpPost("video")]
        public async Task<IActionResult> CreateVideoJob([FromBody] VideoJobPayload payload)
            => await EnqueueJobAsync(payload);

        [HttpPost("fingerprint")]
        public async Task<IActionResult> CreateFingerprintJob([FromForm] FingerprintJobRequest request)
        {
            var tmpPath = _fileStorageService.GetPath(Guid.NewGuid().ToString() + Path.GetExtension(request.FileContent.FileName));
            using (var fs = new FileStream(tmpPath, FileMode.Create))
            {
                await request.FileContent.CopyToAsync(fs);
            }

            FingerprintJobPayload payload = new()
            {
                AlbumId = request.AlbumId,
                SongId = request.SongId,
                FileTmpPath = tmpPath
            };

            return await EnqueueJobAsync(payload);
        }

        //TODO endpoint to get job status

        private async Task<IActionResult> EnqueueJobAsync<T>(T payload)
        {
            if (payload == null)
                return BadRequest("Payload cannot be null");
            var job = new Job
            {
                Id = Guid.NewGuid().ToString(),
                Status = JobStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            job.SetPayload(payload);

            await _jobStore.EnqueueAsync(job);

            return Ok(new
            {
                JobId = job.Id
            });
        }
        public class FingerprintJobRequest
        {
            public required string AlbumId { get; set; }
            public required string SongId { get; set; }
            public required IFormFile FileContent { get; set; }
        }
    }
}
