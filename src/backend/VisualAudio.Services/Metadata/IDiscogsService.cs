namespace VisualAudio.Services.Metadata
{
    public interface IDiscogsService
    {
        Task<DiscogsRelease?> GetReleaseAsync(string artist, string album);
    }
}
