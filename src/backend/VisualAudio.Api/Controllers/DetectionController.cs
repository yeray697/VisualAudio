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
    public class FingerprintController(IFingerprintService _fingerprintService, IPlayingService _playingService) : ControllerBase
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

        [HttpPost("detectOld")]
        public async Task<IActionResult> DetectOld([FromForm] IFormFile file, [FromQuery] double? duration = null)
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

        [HttpPost("detect")]
        public async Task<IActionResult> Detect([FromForm] IFormFile file)
        {
            var stream = await GetStreamAsync(file);
            if (stream == null)
                return BadRequest("No file uploaded.");
            var nowPlaying = await _playingService.DetectNowPlayingAsync(stream);

            return Ok(nowPlaying);
        }

        private static readonly Dictionary<string, List<byte[]>> deviceAudioBuffers = new();
        private const int MAX_CHUNKS = 3; // 6s / 2s
        [HttpPost("detect2")]
        public async Task<IActionResult> DetectChunk([FromForm] IFormFile file, [FromQuery] string deviceId)
        {
            if (!deviceAudioBuffers.ContainsKey(deviceId))
                deviceAudioBuffers[deviceId] = new List<byte[]>();

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            deviceAudioBuffers[deviceId].Add(ms.ToArray());

            // Mantener solo los últimos MAX_CHUNKS
            if (deviceAudioBuffers[deviceId].Count > MAX_CHUNKS)
                deviceAudioBuffers[deviceId].RemoveAt(0);

            // Concatenar los chunks
            var concatenatedBlob = deviceAudioBuffers[deviceId].SelectMany(b => b).ToArray();

            // Guardar en temp file WebM
            var tmpPath = Path.Combine(Path.GetTempPath(), $"device_{deviceId}_{Guid.NewGuid()}.webm");
            await System.IO.File.WriteAllBytesAsync(tmpPath, concatenatedBlob);

            // Convertir a WAV usando FFmpeg
            var wavPath = await _fingerprintService.ConvertToWavAsync(0, tmpPath);

            // Detectar track
            var result = await _fingerprintService.DetectTrack(wavPath);

            return Ok(result);
        }

        [HttpGet("nowplaying")]
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
