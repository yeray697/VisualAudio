using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Metadata
{
    public interface IMetadataService
    {
        Task<AlbumDto?> GetMetadataForAlbumAsync(string artist, string album);
    }
}
