using VisualAudio.Data.Albums.Models;

namespace VisualAudio.Data.Albums
{
    public interface IAlbumMetadataRepository
    {
        Task<string> UpsertFileForAlbumAsync<T>(AlbumMetadataIdentifier identifier, T file);
        Task DeleteFileForAlbumAsync(AlbumMetadataIdentifier identifier);
        Task<Stream> GetFileForAlbumAsync(AlbumMetadataIdentifier identifier);
        string GetStoragePath(AlbumMetadataIdentifier identifier, bool includeBasePath = false, bool isTmpFile = false);
    }
}
