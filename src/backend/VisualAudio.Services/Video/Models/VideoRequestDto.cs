namespace VisualAudio.Services.Video.Models
{
    public class VideoRequestDto
    {
        public string VideoUrl { get; set; }
        public List<VideoSegment> Segments { get; set; } = [];
        public string AlbumId { get; set; }
        public string SongId { get; set; }
        public string MaxQuality { get; set; } = "2160";

        public class VideoSegment
        {
            public double Start { get; set; }
            public double End { get; set; }
        }
    }
}
