using VisualAudio.Data.Albums.Models;
using VisualAudio.Data.FileStorage;

namespace VisualAudio.Data.Albums
{
    public class AlbumMetadataRepository(IFileStorageService fileStorage) : IAlbumMetadataRepository
    {
        private const string albumBasePath = "albums";

        public async Task<string> UpsertFileForAlbumAsync<T>(AlbumMetadataIdentifier identifier, T file)
        {
            var filePath = GetStoragePath(identifier);
            return await fileStorage.SaveFileAsync(file, filePath);
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

        public string GetStoragePath(AlbumMetadataIdentifier identifier, bool includeBasePath = false, bool isTmpFile = false)
        {
            var path = Path.Combine(albumBasePath, identifier.AlbumId, identifier.SongId ?? string.Empty, identifier.Filename);

            return includeBasePath ? fileStorage.GetPath(path, isTmpFile) : path;
        }
    }
}
