namespace VisualAudio.Data.Albums.Models
{
    public class AlbumMetadataIdentifier
    {
        public string AlbumId { get; set; }
        public string? SongId { get; set; }
        public string Filename { get; set; }

        private AlbumMetadataIdentifier(string albumId, string filename, string? songId = null)
        {
            AlbumId = albumId;
            Filename = filename;
            SongId = songId;
        }
        public static AlbumMetadataIdentifier GetAlbumFileIdentifier(string albumId, string filename)
            => new(albumId, filename);

        public static AlbumMetadataIdentifier GetSongFileIdentifier(string albumId, string songId, string filename)
            => new(albumId, filename, songId);
    }
}
