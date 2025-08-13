using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;

using Microsoft.Extensions.Configuration;

using VisualAudio.Data.Albums;
using VisualAudio.Data.Albums.Models;
using VisualAudio.Services.Video.Models;

namespace VisualAudio.Services.Video
{
    public class VideoDownloaderService(IConfiguration config, IAlbumMetadataRepository albumMetadataRepository) : IVideoDownloaderService
    {
        private const string VideoFilename = "video";
        private const string VideoFilenameTmp = $"{VideoFilename}.tmp";

        private readonly string _ytDlpPath = config["YoutubeDLP:Path"] ?? throw new ArgumentException("Missing Path to yt-dlp");
        private readonly string _ffmpegPath = config["YoutubeDLP:FFmpegPath"] ?? throw new ArgumentException("Missing Path to FFmpeg");
        private readonly string _ffprobePath = config["YoutubeDLP:FFprobePath"] ?? throw new ArgumentException("Missing Path to FFprobe");

        public async Task<string?> DownloadVideo(VideoRequestDto request)
        {
            var downloadedVideoPath = await DownloadVideoAsync(request);
            if (request.Segments.Count < 1)
                return downloadedVideoPath;

            var newVideoPath = downloadedVideoPath.Replace(VideoFilenameTmp, VideoFilename);
            await CutVideo(downloadedVideoPath, newVideoPath, request.Segments);
            File.Delete(downloadedVideoPath);
            return Path.GetFileName(newVideoPath);
        }

        private async Task<string> DownloadVideoAsync(VideoRequestDto request)
        {
            var filename = request.Segments.Count < 1 ? VideoFilename : VideoFilenameTmp;
            var identifier = AlbumMetadataIdentifier.GetSongFileIdentifier(request.AlbumId, request.SongId, $"{filename}.mp4");
            var filePath = albumMetadataRepository.GetStoragePath(identifier, true);
            string arguments = $"-f \"bestvideo[ext=mp4][height<={request.MaxQuality}]\" -o \"{filePath}\" \"{request.VideoUrl}\"";

            var processInfo = new ProcessStartInfo
            {
                FileName = _ytDlpPath,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };

            var stdOutput = new List<string>();
            var stdError = new List<string>();

            process.OutputDataReceived += (s, e) => { if (e.Data != null) stdOutput.Add(e.Data); };
            process.ErrorDataReceived += (s, e) => { if (e.Data != null) stdError.Add(e.Data); };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Error al descargar:\n{string.Join("\n", stdError)}");
            }

            return filePath;
        }


        public async Task CutVideo(string inputPath, string outputPath, List<VideoRequestDto.VideoSegment> segments)
        {
            if (segments == null || segments.Count == 0)
                throw new ArgumentException("At least a segment needs to be defined");

            bool hasDecimals = segments.Any(seg => HasDecimals(seg.Start) || HasDecimals(seg.End));
            bool singleSegment = segments.Count == 1;

            if (singleSegment && !hasDecimals)
            {
                // Fast cut without reencode
                var segment = segments[0];
                await RunFfmpeg($"-ss {segment.Start} -i \"{inputPath}\" -to {segment.End} -c copy \"{outputPath}\"");
                return;
            }

            var info = await GetVideoInfo(inputPath);
            string containerExt = Path.GetExtension(outputPath) ?? ".mp4";
            string encodeArgs = DetermineEncodingArgs(info, containerExt);

            if (singleSegment && hasDecimals)
            {
                // Cut with reencode
                var segment = segments[0];

                await RunFfmpeg(
                    $"-i \"{inputPath}\" -ss {FormatTime(segment.Start)} -to {FormatTime(segment.End)} {encodeArgs} \"{outputPath}\""
                );
                return;
            }

            // Cut Multiple segments with reencode
            var tempFiles = new List<string>();
            int index = 0;

            foreach (var segment in segments)
            {
                string tempFile = $"{Path.GetTempFileName()}{containerExt}";
                await RunFfmpeg(
                    $"-i \"{inputPath}\" -ss {FormatTime(segment.Start)} -to {FormatTime(segment.End)} {encodeArgs} \"{tempFile}\""
                );
                tempFiles.Add(tempFile);
                index++;
            }

            // Join the different segments
            var listFile = Path.GetTempFileName();
            var sb = new StringBuilder();
            foreach (var file in tempFiles)
                sb.AppendLine($"file '{file}'");
            await File.WriteAllTextAsync(listFile, sb.ToString());

            await RunFfmpeg($"-f concat -safe 0 -i \"{listFile}\" -c copy \"{outputPath}\"");

            // Clean tmp files
            foreach (var file in tempFiles)
                File.Delete(file);
            File.Delete(listFile);
        }

        private static bool HasDecimals(double value)
        {
            return value % 1 != 0;
        }

        private static string FormatTime(double seconds)
        {
            var t = TimeSpan.FromSeconds(seconds);
            return t.ToString(@"hh\:mm\:ss\.fff", CultureInfo.InvariantCulture);
        }

        private async Task RunFfmpeg(string arguments)
        {
            var processInfo = new ProcessStartInfo
            {
                FileName = _ffmpegPath,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = processInfo };
            var stdError = new List<string>();

            process.ErrorDataReceived += (s, e) => { if (e.Data != null) stdError.Add(e.Data); };

            process.Start();
            process.BeginErrorReadLine();

            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
                throw new Exception($"FFmpeg error:\n{string.Join("\n", stdError)}");
        }

        private async Task<VideoInfo> GetVideoInfo(string inputPath)
        {
            var psi = new ProcessStartInfo
            {
                FileName = _ffprobePath,
                Arguments = $"-v quiet -print_format json -show_format -show_streams \"{inputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = psi };
            var outSb = new StringBuilder();

            process.OutputDataReceived += (s, e) => { if (e.Data != null) outSb.AppendLine(e.Data); };

            process.Start();
            process.BeginOutputReadLine();
            await process.WaitForExitAsync();

            var json = outSb.ToString();
            if (string.IsNullOrWhiteSpace(json))
                throw new Exception("ffprobe no devolvió información.");

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            string videoCodec = "h264";
            long? videoBitrate = null;
            int width = 0;
            int height = 0;
            double? fr = null;
            string pixFmt = "yuv420p";

            string audioCodec = "";
            long? audioBitrate = null;
            string formatName = "";

            if (root.TryGetProperty("format", out var formatElem))
            {
                if (formatElem.TryGetProperty("format_name", out var fn))
                    formatName = fn.GetString() ?? "";
                if (formatElem.TryGetProperty("bit_rate", out var br) && br.ValueKind == JsonValueKind.String)
                {
                    if (long.TryParse(br.GetString(), out var fb)) videoBitrate = fb;
                }

                // Sometimes format.bit_rate is available; else use stream bit_rate
            }

            if (root.TryGetProperty("streams", out var streams))
            {
                foreach (var s in streams.EnumerateArray())
                {
                    var codecType = s.GetProperty("codec_type").GetString();
                    if (codecType == "video")
                    {
                        if (s.TryGetProperty("codec_name", out var cn)) videoCodec = cn.GetString() ?? videoCodec;
                        if (s.TryGetProperty("bit_rate", out var vbr) && vbr.ValueKind == JsonValueKind.String)
                        {
                            if (long.TryParse(vbr.GetString(), out var vb)) videoBitrate = vb;
                        }
                        if (s.TryGetProperty("width", out var w) && w.TryGetInt32(out var wi)) width = wi;
                        if (s.TryGetProperty("height", out var h) && h.TryGetInt32(out var he)) height = he;
                        if (s.TryGetProperty("pix_fmt", out var pf)) pixFmt = pf.GetString() ?? pixFmt;
                        if (s.TryGetProperty("avg_frame_rate", out var afr) && afr.ValueKind == JsonValueKind.String)
                        {
                            var frStr = afr.GetString() ?? "0/1";
                            if (frStr.Contains('/'))
                            {
                                var parts = frStr.Split('/');
                                if (double.TryParse(parts[0], NumberStyles.Any, CultureInfo.InvariantCulture, out var n) &&
                                    double.TryParse(parts[1], NumberStyles.Any, CultureInfo.InvariantCulture, out var d) && d != 0)
                                {
                                    fr = n / d;
                                }
                            }
                            else if (double.TryParse(frStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var f2))
                            {
                                fr = f2;
                            }
                        }
                    }
                    else if (codecType == "audio")
                    {
                        if (s.TryGetProperty("codec_name", out var acn)) audioCodec = acn.GetString() ?? "";
                        if (s.TryGetProperty("bit_rate", out var abr) && abr.ValueKind == JsonValueKind.String)
                        {
                            if (long.TryParse(abr.GetString(), out var ab)) audioBitrate = ab;
                        }
                    }
                }
            }

            return new VideoInfo(
                VideoCodec: videoCodec,
                VideoBitrate: videoBitrate,
                Width: width,
                Height: height,
                FrameRate: fr,
                PixelFormat: pixFmt,
                AudioCodec: string.IsNullOrEmpty(audioCodec) ? "none" : audioCodec,
                AudioBitrate: audioBitrate,
                FormatName: formatName
            );
        }
        private string DetermineEncodingArgs(VideoInfo info, string desiredContainerExtension = ".mp4")
        {
            // Mapeo simple codec -> encoder
            string encoder = info.VideoCodec switch
            {
                "h264" => "libx264",
                "hevc" or "hevc_nvenc" => "libx265",
                "vp9" => "libvpx-vp9",
                "av1" => "libaom-av1",
                _ => "libx264"
            };

            // Si el contenedor final es .mp4 y el encoder elegido no es compatible con mp4 (vp9/av1 prefer webm),
            // forzamos a libx264 para evitar problemas de muxing/compatibilidad.
            if (desiredContainerExtension.Equals(".mp4", StringComparison.OrdinalIgnoreCase) &&
                (encoder == "libvpx-vp9" || encoder == "libaom-av1"))
            {
                encoder = "libx264";
            }

            // Si ffprobe da bitrate, úsalo como target para no crear un fichero con bitrate mayor.
            // Convertimos bits/s a kbps redondeando.
            string videoRateArgs = "";
            if (info.VideoBitrate.HasValue && info.VideoBitrate.Value > 0)
            {
                long kbps = Math.Max(200, info.VideoBitrate.Value / 1000); // mínimo 200k para seguridad
                                                                           // Usar bitrate objetivo y algo de buffer
                videoRateArgs = $"-b:v {kbps}k -maxrate {kbps}k -bufsize {Math.Max(1000, kbps * 2)}k";
            }
            else
            {
                // fallback a CRF según encoder
                int crf = encoder switch
                {
                    "libx264" => 23,
                    "libx265" => 28,
                    "libvpx-vp9" => 33,
                    "libaom-av1" => 35,
                    _ => 23
                };

                // para vp9/av1 se recomienda usar -b:v 0 + -crf N
                if (encoder == "libvpx-vp9" || encoder == "libaom-av1")
                    videoRateArgs = $"-b:v 0 -crf {crf}";
                else
                    videoRateArgs = $"-crf {crf}";
            }

            // audio: si no tiene audio, -an; si tiene bitrate use eso o un fallback
            string audioArgs;
            if (info.AudioCodec == "none")
                audioArgs = "-an";
            else
            {
                var audioKbps = info.AudioBitrate.HasValue && info.AudioBitrate.Value > 0 ? Math.Max(64, info.AudioBitrate.Value / 1000) : 96;
                // for simplicity transcode audio to aac for mp4 output
                audioArgs = $"-c:a aac -b:a {audioKbps}k";
            }

            // pix_fmt: conservar si es yuv420p, si no, forzar yuv420p para compatibilidad
            string pixFmtArg = info.PixelFormat switch
            {
                null => "",
                "" => "",
                "yuv420p" => "-pix_fmt yuv420p",
                _ => "-pix_fmt yuv420p"
            };

            // preset slow (aceptaste preset slow)
            string presetArg = "-preset slow";

            // Para libvpx-vp9 y libaom-av1 podemos añadir opciones recomendadas (suaves)
            string extra = "";
            if (encoder == "libvpx-vp9")
            {
                // libvpx-vp9: use good quality params if using CRF mode
                if (videoRateArgs.Contains("-b:v 0"))
                    extra = "-row-mt 1 -threads 4";
            }
            else if (encoder == "libaom-av1")
            {
                if (videoRateArgs.Contains("-b:v 0"))
                    extra = "-cpu-used 0";
            }

            // Finalmente formamos los args
            var args = new StringBuilder();
            args.Append($"-c:v {encoder} ");
            args.Append($"{presetArg} ");
            args.Append($"{videoRateArgs} ");
            if (!string.IsNullOrEmpty(pixFmtArg)) args.Append($"{pixFmtArg} ");
            if (!string.IsNullOrEmpty(extra)) args.Append($"{extra} ");
            args.Append($"{audioArgs}");

            return args.ToString();
        }


        private record VideoInfo(
            string VideoCodec,
            long? VideoBitrate,    // bits por segundo
            int Width,
            int Height,
            double? FrameRate,
            string PixelFormat,
            string AudioCodec,
            long? AudioBitrate,
            string FormatName
        );

    }
}
