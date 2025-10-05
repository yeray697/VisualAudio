using Microsoft.AspNetCore.Mvc;

using VisualAudio.Services.Fingerprint;
using VisualAudio.Services.Playing;

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
    public class AudioController(IFingerprintService _fingerprintService, IPlayingService _playingService) : ControllerBase
    {
        [HttpPost("storeFingerprint")]
        public async Task<IActionResult> Store([FromForm] TrackUploadDto request)
        {
            return await WrapFileTempActionAsync(request.File, async (tempPath) =>
            {
                var trackId = await _fingerprintService.StoreTrack(tempPath, request.Artist, request.Title, "", request.Album, "");
                return Ok(new { TrackId = trackId });
            });
        }

        [HttpPost("detect")]
        public async Task<IActionResult> Detect([FromForm] IFormFile file)
        {
            var stream = await GetStreamAsync(file);
            if (stream == null)
                return BadRequest("No file uploaded.");
            var nowPlaying = await _playingService.DetectNowPlayingAsync(stream);

            return Ok(nowPlaying);
        }

        [HttpGet("nowPlaying")]
        public IActionResult NowPlaying()
        {
            var nowPlaying = _playingService.GetNowPlaying();

            return Ok(nowPlaying);
        }

        private static async Task<Stream?> GetStreamAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return null;

            var tempPath = Path.Combine(Path.GetTempPath(), $"VisualAudio_{Path.GetRandomFileName()}" + Path.GetExtension(file.FileName));
            Stream stream = System.IO.File.Create(tempPath);
            await file.CopyToAsync(stream);

            return stream;
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
