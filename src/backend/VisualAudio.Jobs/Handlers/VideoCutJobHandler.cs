using VisualAudio.Services.Albums;
using VisualAudio.Services.Video;
using VisualAudio.Services.Video.Models;

namespace VisualAudio.Jobs.Handlers
{
    public class VideoJobPayload
    {
        public string VideoUrl { get; set; }
        public List<VideoSegment> Segments { get; set; } = [];
        public string AlbumId { get; set; }
        public string SongId { get; set; }
        public string MaxQuality { get; set; } = "2160";

        public class VideoSegment
        {
            public double Start { get; set; }
            public double End { get; set; }
        }
    }

    public class VideoCutJobHandler(IVideoDownloaderService videoDownloaderService, IAlbumsService albumsService) : IJobHandler<VideoJobPayload>
    {
        public async Task HandleAsync(string jobId, VideoJobPayload payload, CancellationToken cancellationToken)
        {
            try
            {
                if (payload == null)
                    throw new Exception($"Payload is invalid");

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

                await albumsService.UpdateVideoSongAsync(payload.AlbumId, payload.SongId, resultFilename);
            }
            catch (Exception e)
            {
                throw new Exception($"An error occurred when processing job {jobId}", e);
            }
        }
    }

}
