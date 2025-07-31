using System.Diagnostics;

using VisualAudio.Services.Albums;
using VisualAudio.Services.Fingerprint;
using VisualAudio.Services.Playing;
using VisualAudio.Services.Websocket.Models;

namespace VisualAudio.Services.Websocket;

public class PlayingService(IFingerprintService fingerprintService, IAlbumsService albumsService) : IPlayingService
{
    private PlayingDto? nowPlaying;

    public async Task<PlayingDto?> DetectNowPlayingAsync(Stream audioFile)
    {

        Stopwatch stopwatch = new Stopwatch();
        stopwatch.Start();

        string? tmpPath = null;
        string? tmpWavPath = null;
        try
        {
            tmpPath = await StoreTmpFileAsync(audioFile);
            if (tmpPath == null)
                return null;
            tmpWavPath = await fingerprintService.ConvertToWavAsync(0, tmpPath);
            var result = await fingerprintService.DetectTrack(tmpWavPath);
            return await ProcessFingerprintResultAsync(result, stopwatch);

        }
        catch (System.Exception)
        {

            throw;
        }
        finally
        {
            if (File.Exists(tmpPath))
                File.Delete(tmpPath);
            if (File.Exists(tmpWavPath))
                File.Delete(tmpWavPath);

        }
    }

    private async Task<PlayingDto?> ProcessFingerprintResultAsync(DetectionResult? detectionResult, Stopwatch stopwatch)
    {
        string albumId = string.Empty;
        string songId = string.Empty;
        var metadata = detectionResult?.Match?.Audio?.Track.MetaFields;
        var trackMatchStart = detectionResult?.Match.Audio?.Coverage.TrackMatchStartsAt ?? 0;
        var queryMatchStart = detectionResult?.Match.Audio?.Coverage.QueryMatchStartsAt ?? 0;
        var recordedDuration = detectionResult?.Match.Audio?.Coverage.QueryLength ?? 0;

        if (metadata == null)
            return null;
        if (!metadata.TryGetValue("albumId", out albumId))
        {
            return null;
        }
        if (!metadata.TryGetValue("songId", out songId))
        {
            return null;
        }

        var album = await albumsService.GetAlbumAsync(albumId);
        if (album == null)
            return null;
        var song = album.Songs.FirstOrDefault(s => s.Id == songId);
        if (song == null)
            return null;


        stopwatch.Stop();
        var fingerprintLatency = stopwatch.Elapsed;

        var position = (int)Math.Ceiling(trackMatchStart + recordedDuration - queryMatchStart + (fingerprintLatency.Microseconds / 1000.00));
        nowPlaying = new PlayingDto()
        {
            Album = album,
            Confidence = detectionResult!.Match.Audio?.Confidence,
            NowPlaying = song,
            TrackPosition = position,
            UpdatedAt = DateTime.UtcNow
        };

        return nowPlaying;
    }

    public PlayingDto? GetNowPlaying()
    {
        // TODO: Update object: get current song, update position, ...
        return nowPlaying;
    }


    private async Task<string?> StoreTmpFileAsync(Stream file)
    {
        if (file == null || file.Length == 0)
            return null;
        file.Position = 0;

        var tempPath = Path.Combine(Path.GetTempPath(), $"VisualAudio_{Path.GetRandomFileName()}");

        await using (Stream stream = File.Create(tempPath))
        {
            await file.CopyToAsync(stream);
        }

        return tempPath;
    }

}
