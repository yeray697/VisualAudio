using Microsoft.Extensions.DependencyInjection;

using VisualAudio.Data.Extensions;
using VisualAudio.Services.Albums;
using VisualAudio.Services.Fingerprint;
using VisualAudio.Services.Metadata;
using VisualAudio.Services.Metadata.Lyrics;
using VisualAudio.Services.Playing;
using VisualAudio.Services.Video;
using VisualAudio.Services.Websocket;

namespace VisualAudio.Services.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection RegisterServices(this IServiceCollection services)
        {
            services.AddHttpClient<DiscogsService>();
            services.AddHttpClient<LrcLibLyricsService>();


            return services
                .RegisterData()
                .AddSingleton<IAlbumsService, AlbumsService>()
                .AddScoped<IDiscogsService, DiscogsService>()
                .AddScoped<IMetadataService, MetadataService>()
                .AddScoped<IMusixMatchService, MusixMatchService>()
                .AddScoped<ILrcLibLyricsService, LrcLibLyricsService>()
                .AddScoped<ILyricsService, LyricsService>()
                .AddSingleton<IVideoDownloaderService, VideoDownloaderService>()
                .AddSingleton<IFingerprintService, FingerprintService>()
                .AddSingleton<IPlayingService, PlayingService>();
        }
    }
}
