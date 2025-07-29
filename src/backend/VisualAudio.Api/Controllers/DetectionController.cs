using Microsoft.AspNetCore.Mvc;

using VisualAudio.Services.Fingerprint;

namespace VisualAudio.Api.Controllers
{
    public class TrackUploadDto
    {
        public IFormFile File { get; set; } = default!;
        public string Artist { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Album { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FingerprintController(IFingerprintService _fingerprintService) : ControllerBase
    {
        [HttpPost("store")]
        public async Task<IActionResult> Store([FromForm] TrackUploadDto request)
        {
            return await WrapFileTempActionAsync(request.File, async (tempPath) =>
            {
                var trackId = await _fingerprintService.StoreTrack(tempPath, request.Artist, request.Title, "", request.Album, "");
                return Ok(new { TrackId = trackId });
            });
        }

        [HttpPost("detect")]
        public async Task<IActionResult> Detect([FromForm] IFormFile file, [FromQuery] double? duration = null)
        {
            return await WrapFileTempActionAsync(file, async (tempPath) =>
            {
                var result = await _fingerprintService.DetectTrack(tempPath);

                return Ok(new
                {
                    track = result?.Track?.Title,
                    artist = result?.Track?.Artist,
                    metaFields = result?.Track?.MetaFields,
                    confidence = result?.Match?.Audio?.Confidence,
                    match = result?.Match
                });
            }, duration);

        }

        private async Task<IActionResult> WrapFileTempActionAsync(IFormFile file, Func<string, Task<IActionResult>> func, double? duration = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Guardar en un archivo temporal
            string? convertedTmpPath = null;
            var tempPath = Path.Combine(Path.GetTempPath(), $"VisualAudio_{Path.GetRandomFileName()}" + Path.GetExtension(file.FileName));
            await using (Stream stream = System.IO.File.Create(tempPath))
            {
                await file.CopyToAsync(stream);
            }

            try
            {
                convertedTmpPath = await _fingerprintService.ConvertToWavAsync(duration ?? 0, tempPath);
                return await func(convertedTmpPath);
            }
            finally
            {
                if (System.IO.File.Exists(tempPath))
                    System.IO.File.Delete(tempPath);
                if (System.IO.File.Exists(convertedTmpPath))
                    System.IO.File.Delete(convertedTmpPath);
            }
        }
    }
}
