using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Metadata.Lyrics
{
    public interface ILyricsService
    {
        Task<string?> GetLyricsAsync(string songName, int songDuration, AlbumDto album);
    }
}
