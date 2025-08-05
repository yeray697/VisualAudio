namespace VisualAudio.Services.Metadata.Lyrics
{
    public interface IMusixMatchService
    {
        Task<LyricResult?> SearchAsync(SearchSongInfo info);
    }
}

public class LyricResult
{
    public string Title { get; set; } = "";
    public List<string> Artists { get; set; } = new();
    public string? SyncedLyrics { get; set; }
    public string? Lyrics { get; set; }
}
