using Microsoft.AspNetCore.Mvc;

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

        public JobsController(IJobStore jobStore)
        {
            _jobStore = jobStore;
        }

        [HttpPost("video")]
        public async Task<IActionResult> CreateVideoJob([FromBody] VideoJobPayload payload)
            => await EnqueueJobAsync(payload);

        [HttpPost("fingerprint")]
        public async Task<IActionResult> CreateFingerprintJob([FromForm] FingerprintJobRequest request)
        {
            var uploadsFolder = Path.Combine("uploads"); // o Path.Combine("ruta", "a", "uploads")
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }
            var extension = Path.GetExtension(request.FileContent.FileName);
            var tempPath = Path.Combine(uploadsFolder, Guid.NewGuid().ToString() + extension); //TODO: Generate this using IOption directory value
            using (var fs = new FileStream(tempPath, FileMode.Create))
            {
                await request.FileContent.CopyToAsync(fs);
            }

            FingerprintJobPayload payload = new()
            {
                AlbumId = request.AlbumId,
                SongId = request.SongId,
                FileTmpPath = tempPath
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
            public string AlbumId { get; set; }
            public string SongId { get; set; }
            public IFormFile FileContent { get; set; }
        }
    }
}
