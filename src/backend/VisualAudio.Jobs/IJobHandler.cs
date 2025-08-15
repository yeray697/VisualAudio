namespace VisualAudio.Jobs
{
    public interface IJobHandler<TPayload>
    {
        Task HandleAsync(string jobId, TPayload payload, CancellationToken cancellationToken);
    }
}
