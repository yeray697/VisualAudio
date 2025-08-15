namespace VisualAudio.Jobs
{
    public interface IJobStore
    {
        Task EnqueueAsync(Job job);
        Task<Job?> GetNextPendingJobAsync();
        Task<List<Job>> GetJobsByStatusAsync(JobStatus status);
        Task UpdateStatusAsync(string jobId, JobStatus status, string? errorMessage = null);
    }

}
