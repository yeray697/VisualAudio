using VisualAudio.Data.Albums.Models;
using VisualAudio.Data.FileStorage;

namespace VisualAudio.Data.Albums
{
    public class AlbumMetadataRepository(IFileStorageService fileStorage) : IAlbumMetadataRepository
    {
        private const string albumBasePath = "albums";

        public async Task UpsertFileForAlbumAsync<T>(AlbumMetadataIdentifier identifier, T file)
        {
            var filePath = GetStoragePath(identifier);
            await fileStorage.SaveFileAsync(file, filePath);
        }

        public async Task DeleteFileForAlbumAsync(AlbumMetadataIdentifier identifier)
        {
            var filePath = GetStoragePath(identifier);
            await fileStorage.DeleteFileAsync(filePath);
        }

        public async Task<Stream> GetFileForAlbumAsync(AlbumMetadataIdentifier identifier)
        {
            var filePath = GetStoragePath(identifier);
            return await fileStorage.ReadFileAsync(filePath);
        }

        private static string GetStoragePath(AlbumMetadataIdentifier identifier)
        {
            return Path.Combine(albumBasePath, identifier.AlbumId, identifier.SongId ?? string.Empty, identifier.Filename);
        }
    }
}
