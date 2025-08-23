using VisualAudio.Services.Video.Models;

namespace VisualAudio.Services.Albums
{
    public interface IMediaAttachmentService
    {
        Task<string?> StartProcessingVideoAsync(VideoRequestDto videoRequestDto);
        Task<string?> StartProcessingAudioAsync(VideoRequestDto videoRequestDto);
        Task UploadImage(string albumId, string? songId, string fileExtension, Stream content);
        Task UploadLyrics(string albumId, string songId, Stream content);
        Task DeleteImage(string albumId, string? songId);
        Task DeleteSongAsync(string albumId, string songId);
        Task DeleteLyricsAsync(string albumId, string songId);
        Task DeleteVideoAsync(string albumId, string songId);
    }
}
