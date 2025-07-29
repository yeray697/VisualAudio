namespace VisualAudio.Data.Albums.Models
{
    public class Song
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; }
        public int Position { get; set; }
        public int Duration { get; set; }
        public string? FingerprintId { get; set; }
        public string? SongFilename { get; set; }
        public string? SongImageFilename { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
