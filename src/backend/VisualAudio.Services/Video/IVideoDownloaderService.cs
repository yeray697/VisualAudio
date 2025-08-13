using VisualAudio.Services.Video.Models;

namespace VisualAudio.Services.Video
{
    public interface IVideoDownloaderService
    {
        Task<string?> DownloadVideo(VideoRequestDto request);
    }
}
