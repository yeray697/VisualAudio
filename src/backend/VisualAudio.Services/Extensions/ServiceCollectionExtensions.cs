using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using VisualAudio.Data.Extensions;
using VisualAudio.Data.FileStorage;
using VisualAudio.Services.Albums;
using VisualAudio.Services.Fingerprint;
using VisualAudio.Services.Jobs;
using VisualAudio.Services.Jobs.Handlers;
using VisualAudio.Services.Metadata;
using VisualAudio.Services.Metadata.Lyrics;
using VisualAudio.Services.Playing;
using VisualAudio.Services.Video;

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
                .AddSingleton<IMediaAttachmentService, MediaAttachmentService>()
                .AddScoped<IDiscogsService, DiscogsService>()
                .AddScoped<IMetadataService, MetadataService>()
                .AddScoped<IMusixMatchService, MusixMatchService>()
                .AddScoped<ILrcLibLyricsService, LrcLibLyricsService>()
                .AddScoped<ILyricsService, LyricsService>()
                .AddSingleton<IVideoDownloaderService, VideoDownloaderService>()
                .AddSingleton<IFingerprintService, FingerprintService>()
                .AddSingleton<IPlayingService, PlayingService>();
        }
        public static IServiceCollection RegisterJobService(this IServiceCollection services)
        {
            return services
                .AddSingleton<IJobStore>(sp =>
                {
                    var config = sp.GetRequiredService<IOptions<FileStorageOptions>>();
                    var jobsPath = config.Value.BasePath;
                    return new JsonJobStore(jobsPath);
                })
                .AddSingleton<IJobHandler<VideoJobPayload>, VideoCutJobHandler>()
                .AddSingleton<IJobHandler<FingerprintJobPayload>, FingerprintJobHandler>()
                .AddHostedService<JobWorker>();
        }
    }
}
