using VisualAudio.Services.Playing.Models;

namespace VisualAudio.Services.Playing;

public interface IPlayingService
{
    PlayingDto? GetNowPlaying();
    Task<PlayingDto?> DetectNowPlayingAsync(Stream audioFile);
}
