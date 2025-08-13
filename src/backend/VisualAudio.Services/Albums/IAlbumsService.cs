using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Albums
{
    public interface IAlbumsService
    {
        Task CreateAlbumAsync(AlbumDto album);
        Task<AlbumDto?> GetAlbumAsync(string id);
        Task<IEnumerable<AlbumDto>> GetAllAsync();
        Task UpdateAlbumAsync(string id, AlbumDto album);
        Task DeleteAlbumAsync(string id);

        Task DeleteMetadataFileAsync(MetadataFileType fileType, string albumId, string? songId = null);
        Task UpsertMetadataFileAsync(MetadataFileType fileType, string fileExtension, Stream content, string albumId, string? songId = null);
        Task UpdateVideoSongAsync(string albumId, string songId, string filename);
        Task<Stream?> GetMetadataFileAsync(MetadataFileType fileType, string albumId, string? songId = null);
    }
}
