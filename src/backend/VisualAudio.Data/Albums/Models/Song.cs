namespace VisualAudio.Data.Albums.Models
{
    public class Song
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public required string Name { get; set; }
        public required string Artist { get; set; }
        public int Position { get; set; }
        public int Duration { get; set; }
        public SongFingerprint? SongFingerprint { get; set; }
        public string? SongLyricsFilename { get; set; }
        public string? SongImageFilename { get; set; }
        public Video? SongVideo { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Video
    {
        public required string JobId { get; set; }
        public string? Filename { get; set; }
        public required string VideoUrl { get; set; }
        public List<VideoSegment> Segments { get; set; } = [];
        public string MaxQuality { get; set; } = "2160";

        public class VideoSegment
        {
            public double Start { get; set; }
            public double End { get; set; }
        }
    }

    public class SongFingerprint
    {
        public required string JobId { get; set; }
        public required string Filename { get; set; }
        public required string FingerprintId { get; set; }
    }
}
