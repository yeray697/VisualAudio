
using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Metadata.Models
{
    public class SongMetadataDto : SongDto
    {
        public string? Lyrics { get; set; }
    }
    public class AlbumMetadataDto : AlbumDto
    {
        public new IEnumerable<SongMetadataDto> Songs { get; set; } = [];
    }
}
