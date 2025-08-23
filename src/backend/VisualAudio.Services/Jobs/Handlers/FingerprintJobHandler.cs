using Microsoft.AspNetCore.Http;

using VisualAudio.Data.Albums;
using VisualAudio.Services.Fingerprint;

namespace VisualAudio.Services.Jobs.Handlers
{
    public class FingerprintJobPayload
    {
        public string AlbumId { get; set; }
        public string SongId { get; set; }
        public string FileTmpPath { get; set; }
    }

    public class FingerprintJobHandler(IFingerprintService fingerprintService, IAlbumRepository albumRepository) : IJobHandler<FingerprintJobPayload>
    {
        public async Task HandleAsync(string jobId, FingerprintJobPayload payload, CancellationToken cancellationToken)
        {
            try
            {
                if (payload == null)
                    throw new Exception($"Payload is invalid");

                var album = await albumRepository.GetAlbumAsync(payload.AlbumId);
                if (album == null)
                    return;
                var song = album.Songs.FirstOrDefault(s => s.Id == payload.SongId);
                if (song == null) return;

                using var fileStream = File.OpenRead(payload.FileTmpPath);
                var convertedTmpPath = await fingerprintService.ConvertToWavAsync(fileStream);
                var fingerPrintId = await fingerprintService.StoreTrack(convertedTmpPath, album.Artist, song.Name, song.Id, album.Title, album.Id);

                song.SongFingerprint ??= new()
                {
                    JobId = jobId
                };

                song.SongFingerprint.FingerprintId = fingerPrintId;
                song.SongFingerprint.Filename = "original-song";

                await albumRepository.UpdateAlbumAsync(payload.AlbumId, album);

            }
            catch (Exception e)
            {
                throw new Exception($"An error occurred when processing job {jobId}", e);
            }
            finally
            {
                if (File.Exists(payload.FileTmpPath))
                    File.Delete(payload.FileTmpPath);
            }
        }
    }

}
