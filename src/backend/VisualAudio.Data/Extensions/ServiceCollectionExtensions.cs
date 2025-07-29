using Microsoft.Extensions.DependencyInjection;

using VisualAudio.Data.Albums;
using VisualAudio.Data.FileStorage;

namespace VisualAudio.Data.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection RegisterData(this IServiceCollection services)
        {
            return services
                .AddScoped<IFileStorageService, FileStorageService>()
                .AddScoped<IAlbumRepository, AlbumRepository>()
                .AddScoped<IAlbumMetadataRepository, AlbumMetadataRepository>();
        }
    }
}
