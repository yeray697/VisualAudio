namespace VisualAudio.Services.Metadata.Lyrics
{
    public class LrcLibSearchResponse
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string TrackName { get; set; }
        public required string ArtistName { get; set; }
        public required string AlbumName { get; set; }
        public double Duration { get; set; }
        public bool Instrumental { get; set; }
        public required string PlainLyrics { get; set; }
        public required string SyncedLyrics { get; set; }
    }

    public class LrcLibResult
    {
        public required string Title { get; set; }
        public required string[] Artists { get; set; }
        public required string Lyrics { get; set; }
        public required string SyncedLyrics { get; set; }
    }


    public interface ILrcLibLyricsService
    {
        Task<LrcLibResult?> SearchAsync(
            string title,
            string artist,
            string? album,
            int songDuration
        );
    }
}
