using System.Text.Json;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using VisualAudio.Jobs.Extensions;

namespace VisualAudio.Jobs
{
    public class JobWorker : BackgroundService
    {
        private readonly ILogger<JobWorker> _logger;
        private readonly IJobStore _jobStore; // almacenamiento persistente (JSON, SQLite, etc.)
        private readonly IServiceProvider _serviceProvider;

        public JobWorker(ILogger<JobWorker> logger, IJobStore jobStore, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _jobStore = jobStore;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("JobWorker iniciado.");

            // Recuperar jobs que estaban en estado Processing (fallo anterior)
            var processingJobs = await _jobStore.GetJobsByStatusAsync(JobStatus.Processing);
            foreach (var job in processingJobs)
            {
                _logger.LogWarning("Reintentando job en estado Processing: {JobId}", job.Id);
                await ProcessJob(job, stoppingToken);
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                var job = await _jobStore.GetNextPendingJobAsync();
                if (job != null)
                {
                    await ProcessJob(job, stoppingToken);
                }
                else
                {
                    await Task.Delay(1000, stoppingToken); // Espera antes de revisar de nuevo
                }
            }
        }

        private async Task ProcessJob(Job job, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Procesando job {JobId} de tipo {JobType}", job.Id, job.Type);

            try
            {
                await _jobStore.UpdateStatusAsync(job.Id, JobStatus.Processing);

                using var scope = _serviceProvider.CreateScope();
                var payloadType = job.GetPayloadType();
                if (payloadType == null)
                {
                    await _jobStore.UpdateStatusAsync(job.Id, JobStatus.Failed, "Tipo de payload desconocido");
                    return;
                }
                var handlerType = typeof(IJobHandler<>).MakeGenericType(payloadType);
                var handler = scope.ServiceProvider.GetService(handlerType);

                if (handler == null)
                    throw new InvalidOperationException($"No se encontró handler para {job.Type}");

                var method = handlerType.GetMethod("HandleAsync");
                if (method == null)
                    throw new InvalidOperationException("Handler no implementa HandleAsync");

                var payload = JsonSerializer.Deserialize(job.PayloadJson, payloadType)!;

                await (Task)method.Invoke(handler, new object[] { job.Id, payload, cancellationToken })!;

                await _jobStore.UpdateStatusAsync(job.Id, JobStatus.Completed);
                _logger.LogInformation("Job {JobId} completado.", job.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error procesando job {JobId}", job.Id);
                await _jobStore.UpdateStatusAsync(job.Id, JobStatus.Failed, ex.Message);
            }
        }
    }


}
