using VisualAudio.Services.Websocket.Models;

namespace VisualAudio.Services.Playing;

public interface IPlayingService
{
    PlayingDto? GetNowPlaying();
    Task<PlayingDto?> DetectNowPlayingAsync(Stream audioFile);
}
