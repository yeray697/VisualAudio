namespace VisualAudio.Services.Fingerprint
{
    public interface IFingerprintService
    {
        Task<string> ConvertToWavAsync(double duration, string inputPath);
        Task<string?> ConvertToWavAsync(Stream content);
        Task<string> StoreTrack(string path, string artist, string song, string songId, string album, string albumId);
        Task<DetectionResult?> DetectTrack(string path);
    }
}
