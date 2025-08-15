using System.Text.Json;

namespace VisualAudio.Jobs
{
    public class JsonJobStore : IJobStore
    {
        private readonly string _filePath;
        private readonly object _lock = new();

        public JsonJobStore(string basePath)
        {
            _filePath = Path.Combine(basePath, "jobs.json");
            if (!File.Exists(_filePath))
            {
                File.WriteAllText(_filePath, "[]");
            }
        }

        public Task EnqueueAsync(Job job)
        {
            lock (_lock)
            {
                var jobs = LoadJobs();
                jobs.Add(job);
                SaveJobs(jobs);
            }
            return Task.CompletedTask;
        }

        public Task<Job?> GetNextPendingJobAsync()
        {
            lock (_lock)
            {
                var jobs = LoadJobs();
                var job = jobs.FirstOrDefault(j => j.Status == JobStatus.Pending);
                return Task.FromResult(job);
            }
        }

        public Task<List<Job>> GetJobsByStatusAsync(JobStatus status)
        {
            lock (_lock)
            {
                var jobs = LoadJobs().Where(j => j.Status == status).ToList();
                return Task.FromResult(jobs);
            }
        }

        public Task UpdateStatusAsync(string jobId, JobStatus status, string? errorMessage = null)
        {
            lock (_lock)
            {
                var jobs = LoadJobs();
                var job = jobs.FirstOrDefault(j => j.Id == jobId);
                if (job != null)
                {
                    job.Status = status;
                    job.ErrorMessage = errorMessage;
                    job.UpdatedAt = DateTime.UtcNow;
                    SaveJobs(jobs);
                }
            }
            return Task.CompletedTask;
        }

        private List<Job> LoadJobs()
        {
            var json = File.ReadAllText(_filePath);
            return JsonSerializer.Deserialize<List<Job>>(json) ?? new List<Job>();
        }

        private void SaveJobs(List<Job> jobs)
        {
            var json = JsonSerializer.Serialize(jobs, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_filePath, json);
        }
    }

}
