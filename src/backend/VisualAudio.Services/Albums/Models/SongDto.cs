using VisualAudio.Data.Albums.Models;

namespace VisualAudio.Services.Albums.Models
{
    public class SongDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public required string Name { get; set; }
        public required string Artist { get; set; }
        public int Position { get; set; }
        public int Duration { get; set; }
        public SongFingerprintDto? SongFingerprint { get; set; }
        public string? SongImageFilename { get; set; }
        public string? SongLyricsFilename { get; set; }
        public VideoDto? SongVideo { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    }

    public class VideoDto
    {
        public required string JobId { get; set; }
        public string? Filename { get; set; }
        public required string VideoUrl { get; set; }
        public List<VideoSegmentDto> Segments { get; set; } = [];
        public string MaxQuality { get; set; } = "2160";

        public class VideoSegmentDto
        {
            public double Start { get; set; }
            public double End { get; set; }
        }
    }
    public class SongFingerprintDto
    {
        public required string JobId { get; set; }
        public required string Filename { get; set; }
        public required string FingerprintId { get; set; }
    }
}
