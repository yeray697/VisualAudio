using Microsoft.Extensions.DependencyInjection;

using VisualAudio.Data.Extensions;
using VisualAudio.Services.Albums;
using VisualAudio.Services.Fingerprint;
using VisualAudio.Services.Metadata;
using VisualAudio.Services.Playing;
using VisualAudio.Services.Websocket;

namespace VisualAudio.Services.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection RegisterServices(this IServiceCollection services)
        {
            services.AddHttpClient<DiscogsService>();

            return services
                .RegisterData()
                .AddSingleton<IAlbumsService, AlbumsService>()
                .AddScoped<IDiscogsService, DiscogsService>()
                .AddScoped<IMetadataService, MetadataService>()
                .AddSingleton<IFingerprintService, FingerprintService>()
                .AddSingleton<IPlayingService, PlayingService>();
        }
    }
}
