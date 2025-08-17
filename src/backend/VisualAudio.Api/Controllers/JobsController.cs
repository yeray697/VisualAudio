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
        {
            if (payload == null)
                return BadRequest("Payload no puede ser null");

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
                Message = "Job creado correctamente",
                JobId = job.Id
            });
        }
    }
}
