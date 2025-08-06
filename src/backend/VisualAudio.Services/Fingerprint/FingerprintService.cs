using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

using SoundFingerprinting;
using SoundFingerprinting.Audio;
using SoundFingerprinting.Builder;
using SoundFingerprinting.Configuration;
using SoundFingerprinting.Data;
using SoundFingerprinting.Emy;
using SoundFingerprinting.InMemory;
using SoundFingerprinting.Query;
using SoundFingerprinting.Strides;

namespace VisualAudio.Services.Fingerprint
{
    public class FingerprintService : IFingerprintService
    {
        private const int maxSeconds = 15;
        private readonly ILogger<FingerprintService> _logger;
        private readonly IModelService modelService;
        private readonly IAudioService audioService;

        public FingerprintService(ILogger<FingerprintService> logger, IConfiguration config)
        {
            _logger = logger;
            var host = config["Fingerprint:Emy:Host"] ?? throw new ArgumentException("Missing Fingerprint__Emy__Host parameter on appsettings");
            var port = config["Fingerprint:Emy:Port"] ?? throw new ArgumentException("Missing Fingerprint__Emy__Port parameter on appsettings");
            _logger.LogInformation("Host: {Host}", host);
            _logger.LogInformation("Port: {Port}", port);
            if (!int.TryParse(port, out var portParsed) || portParsed <= 0)
                throw new ArgumentException("Fingerprint__Emy__Port must be a positive int");

            bool useInMemoryStorage = bool.TryParse(config["Fingerprint:InMemoryStorage"], out var result) && result;
            if (useInMemoryStorage)
                modelService = new InMemoryModelService();
            else
                modelService = EmyModelService.NewInstance(host, portParsed);
            audioService = new FFmpegAudioService();
        }

        public async Task<string?> ConvertToWavAsync(Stream content)
        {
            content.Position = 0;
            var tmpPath = await StoreTmpFileAsync(content);
            var wavPath = await ConvertToWavAsync(0, tmpPath);

            if (File.Exists(tmpPath))
                File.Delete(tmpPath);

            return wavPath;
        }

        public async Task<string> ConvertToWavAsync(double duration, string inputPath)
        {
            var start = (duration / 1000.00) > maxSeconds ? (duration / 1000.00) - maxSeconds : 0;
            Console.WriteLine("Duration: {0}", duration);
            Console.WriteLine("Start: {0}", start.ToString(System.Globalization.CultureInfo.InvariantCulture));
            var seekArgs = $"-ss ${start.ToString(System.Globalization.CultureInfo.InvariantCulture)}";

            var outputPath = Path.ChangeExtension(inputPath, ".wav");
            var ffmpeg = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-y -i \"{inputPath}\" -ar 44100 -ac 2 -sample_fmt s16 -af loudnorm \"{outputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            var process = System.Diagnostics.Process.Start(ffmpeg);
            await process.WaitForExitAsync();
            return outputPath;
        }

        public async Task<string> StoreTrack(string path, string artist, string song, string songId, string album, string albumId)
        {

            var trackInfo = new TrackInfo(Guid.NewGuid().ToString(), song, artist, new Dictionary<string, string>()
            {
                { "album", album },
                { "albumId", albumId },
                { "songId", songId },
             });
            var fingerprints = await FingerprintCommandBuilder.Instance
                .BuildFingerprintCommand()
                .From(path)
                .WithFingerprintConfig(config =>
                {
                    config.Audio.Stride = new IncrementalStaticStride(256); // o IncrementalStaticStride(128)
                    config.Audio.FrequencyRange = new FrequencyRange(318, 2000);
                    return config;
                })
                .UsingServices(audioService)
                .Hash();
            modelService.Insert(trackInfo, fingerprints);

            if (File.Exists(path))
                File.Delete(path);

            return trackInfo.Id;
        }

        public async Task<DetectionResult?> DetectTrack(string path)
        {
            var queryResult = await QueryCommandBuilder.Instance
                .BuildQueryCommand()
                .From(path)
                .WithQueryConfig(config =>
                {
                    config.Audio.FingerprintConfiguration.Stride = new IncrementalRandomStride(256, 512);
                    config.Audio.ThresholdVotes = 3;  // más permisivo para fragmentos cortos
                    config.Audio.PermittedGap = 3.0;  // tolerancia mayor
                    return config;
                })
                .UsingServices(modelService, audioService)
                .Query();

            if (!queryResult.ContainsMatches)
                return null;

            _logger.LogInformation("Match");
            var bestMatch = queryResult.BestMatch!;
            if (bestMatch != null && modelService is EmyModelService emyModelService)
                emyModelService.RegisterMatches([bestMatch.ConvertToAvQueryMatch()], false);

            var track = modelService.ReadTrackById(bestMatch.TrackId);

            return new DetectionResult()
            {
                Match = bestMatch,
                Track = track!
            };
        }

        public void DeleteTrack(string fingerprintId)
        {
            modelService.DeleteTrack(fingerprintId);
        }

        private static async Task<string?> StoreTmpFileAsync(Stream file)
        {
            if (file == null || file.Length == 0)
                return null;

            var tempPath = Path.Combine(Path.GetTempPath(), $"VisualAudio_{Path.GetRandomFileName()}");

            await using (Stream stream = File.Create(tempPath))
            {
                await file.CopyToAsync(stream);
            }

            return tempPath;
        }

    }

    public class DetectionResult
    {
        public AVResultEntry Match { get; set; }
        public TrackInfo Track { get; set; }
    }
}
