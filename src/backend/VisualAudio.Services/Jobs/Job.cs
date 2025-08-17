namespace VisualAudio.Services.Jobs
{
    public enum JobStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    public class Job
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = default!;
        public string PayloadJson { get; set; } = default!;
        public JobStatus Status { get; set; } = JobStatus.Pending;
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
