namespace VisualAudio.Services.Metadata
{
    public interface IDiscogsService
    {
        Task<DiscogsRelease?> GetReleaseAsync(string artist, string album);
        Task<DiscogsRelease?> GetReleaseAsync(int releaseId);
        Task<List<int>> GetMyCollectionReleaseIdsAsync();
    }
}
