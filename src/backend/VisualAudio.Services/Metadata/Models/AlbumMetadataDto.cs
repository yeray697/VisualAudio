
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
        public IEnumerable<RelatedVideos> RelatedVideos { get; set; }
    }

    public class RelatedVideos
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Uri { get; set; }
        public int Duration { get; set; }
    }

}
