namespace VisualAudio.Services.Metadata.Lyrics
{
    public class LrcLibSearchResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string TrackName { get; set; }
        public string ArtistName { get; set; }
        public string AlbumName { get; set; }
        public double Duration { get; set; }
        public bool Instrumental { get; set; }
        public string PlainLyrics { get; set; }
        public string SyncedLyrics { get; set; }
    }

    public class LrcLibResult
    {
        public string Title { get; set; }
        public string[] Artists { get; set; }
        public string Lyrics { get; set; }
        public string SyncedLyrics { get; set; }
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
