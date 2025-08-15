using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using VisualAudio.Data.FileStorage;
using VisualAudio.Jobs.Handlers;

namespace VisualAudio.Jobs.Extensions
{
    public static class ServiceCollectionExtensions
    {
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
                .AddHostedService<JobWorker>();
        }
    }
}
