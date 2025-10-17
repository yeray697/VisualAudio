using VisualAudio.Services.Metadata.Models;

namespace VisualAudio.Services.Metadata
{
    public interface IMetadataService
    {
        Task<AlbumMetadataDto?> GetMetadataForAlbumAsync(string artist, string album);
        Task SyncWithDiscogsAsync();
    }
}
