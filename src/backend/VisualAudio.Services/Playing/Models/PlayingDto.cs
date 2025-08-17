using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Playing.Models;

public class PlayingDto
{
    public required DateTime UpdatedAt { get; set; }
    public required SongDto NowPlaying { get; set; }
    public required AlbumDto Album { get; set; }
    public double? Confidence { get; set; }
    public required int TrackPosition { get; set; }
}
