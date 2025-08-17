using VisualAudio.Services.Video.Models;

namespace VisualAudio.Jobs.Services
{
    public interface IMediaAttachmentService
    {
        Task<string?> StartProcessingVideoAsync(VideoRequestDto videoRequestDto);
        Task<string?> StartProcessingAudioAsync(VideoRequestDto videoRequestDto);
        Task UploadImage(string albumId, string? songId, string fileExtension, Stream content);
        Task DeleteImage(string albumId, string? songId);
        Task DeleteSongAsync(string albumId, string songId);
        Task DeleteLyricsAsync(string albumId, string songId);
        Task DeleteVideoAsync(string albumId, string songId);
    }
}
