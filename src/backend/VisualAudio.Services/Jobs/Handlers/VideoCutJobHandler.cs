using VisualAudio.Data.Albums;
using VisualAudio.Services.Video;
using VisualAudio.Services.Video.Models;

namespace VisualAudio.Services.Jobs.Handlers
{
    public class VideoJobPayload
    {
        public required string VideoUrl { get; set; }
        public List<VideoSegment> Segments { get; set; } = [];
        public required string AlbumId { get; set; }
        public required string SongId { get; set; }
        public string MaxQuality { get; set; } = "2160";

        public class VideoSegment
        {
            public double Start { get; set; }
            public double End { get; set; }
        }
    }

    public class VideoCutJobHandler(IVideoDownloaderService videoDownloaderService, IAlbumRepository albumRepository) : IJobHandler<VideoJobPayload>
    {
        public async Task HandleAsync(string jobId, VideoJobPayload payload, CancellationToken cancellationToken)
        {
            try
            {
                if (payload == null)
                    throw new Exception($"Payload is invalid");

                var album = await albumRepository.GetAlbumAsync(payload.AlbumId);
                if (album == null)
                    return;
                var song = album.Songs.FirstOrDefault(s => s.Id == payload.SongId);
                if (song == null) return;

                var resultFilename = await videoDownloaderService.DownloadVideo(new()
                {
                    AlbumId = payload.AlbumId,
                    MaxQuality = payload.MaxQuality,
                    SongId = payload.SongId,
                    VideoUrl = payload.VideoUrl,
                    Segments = payload.Segments.Select(s => new VideoRequestDto.VideoSegment() { End = s.End, Start = s.Start }).ToList()
                });
                if (resultFilename == null)
                    throw new Exception($"Download or Cut result is invalid");

                song.SongVideo ??= new()
                {
                    JobId = jobId,
                    MaxQuality = payload.MaxQuality,
                    Segments = [.. payload.Segments.Select(s => new Data.Albums.Models.Video.VideoSegment() { End = s.End, Start = s.Start })],
                    Filename = resultFilename,
                    VideoUrl = payload.VideoUrl
                };

                await albumRepository.UpdateAlbumAsync(payload.AlbumId, album);
            }
            catch (Exception e)
            {
                throw new Exception($"An error occurred when processing job {jobId}", e);
            }
        }
    }

}
