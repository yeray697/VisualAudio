using VisualAudio.Data.Albums.Models;
using VisualAudio.Data.FileStorage;

namespace VisualAudio.Data.Albums
{
    public class AlbumRepository(IFileStorageService fileStorage) : IAlbumRepository
    {
        private const string albumBasePath = "albums";
        private const string metadataFile = "metadata.json";

        public async Task<Album> CreateAlbumAsync(Album album)
        {
            var albumPath = GetStoragePath(album.Id, metadataFile);
            _ = await fileStorage.SaveFileAsync(album, albumPath);
            return album;
        }

        public async Task<Album?> GetAlbumAsync(string id)
        {
            var path = GetStoragePath(id, metadataFile);
            return await fileStorage.ReadFileAsync<Album>(path);
        }

        public async Task<IEnumerable<Album>> GetAllAsync()
        {
            var dir = fileStorage.GetPath(GetStoragePath());
            if (!Directory.Exists(dir))
                return [];

            var albums = new List<Album>();
            foreach (var albumDir in Directory.GetDirectories(dir))
            {
                var albumId = Path.GetFileName(albumDir);
                var album = await GetAlbumAsync(albumId);
                if (album != null)
                    albums.Add(album);
            }
            return albums;
        }

        public async Task<Album> UpdateAlbumAsync(string id, Album album)
        {
            var albumPath = GetStoragePath(album.Id, metadataFile);
            await fileStorage.SaveFileAsync(album, albumPath);

            return album;
        }

        public async Task DeleteAlbumAsync(string id)
        {
            var dir = GetStoragePath(id);
            await fileStorage.DeleteDirectoryAsync(dir);
        }

        private string GetStoragePath(params string[] paths)
        {
            return Path.Combine([albumBasePath, .. paths]);
        }
    }
}
