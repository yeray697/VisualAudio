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
    }
}
