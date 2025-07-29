using VisualAudio.Data.Albums.Models;

namespace VisualAudio.Data.Albums
{
    public interface IAlbumRepository
    {
        Task<Album> CreateAlbumAsync(Album album);
        Task<Album?> GetAlbumAsync(string id);
        Task<IEnumerable<Album>> GetAllAsync();
        Task<Album> UpdateAlbumAsync(string id, Album album);
        Task DeleteAlbumAsync(string id);

    }
}
