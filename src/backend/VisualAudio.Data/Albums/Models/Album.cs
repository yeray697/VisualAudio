namespace VisualAudio.Data.Albums.Models
{
    public class Album
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public AlbumType AlbumType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? AlbumImageFilename { get; set; }
        public IEnumerable<Song> Songs { get; set; } = [];
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum AlbumType
    {
        CD, LP, Casette
    }
}
