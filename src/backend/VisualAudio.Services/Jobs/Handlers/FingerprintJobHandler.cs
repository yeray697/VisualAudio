using Microsoft.AspNetCore.Http;

using VisualAudio.Data.Albums;
using VisualAudio.Data.Albums.Models;
using VisualAudio.Services.Fingerprint;

namespace VisualAudio.Services.Jobs.Handlers
{
    public class FingerprintJobPayload
    {
        public string AlbumId { get; set; }
        public string SongId { get; set; }
        public string FileTmpPath { get; set; }
    }

    public class FingerprintJobHandler(IFingerprintService fingerprintService, IAlbumRepository albumRepository, IAlbumMetadataRepository albumMetadataRepository) : IJobHandler<FingerprintJobPayload>
    {
        private const string FileName = "original-song";
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

                var filename = $"{FileName}{Path.GetExtension(payload.FileTmpPath)}";
                var identifier = AlbumMetadataIdentifier.GetSongFileIdentifier(payload.AlbumId, payload.SongId, filename);
                var filePath = albumMetadataRepository.GetStoragePath(identifier, true);
                File.Move(convertedTmpPath, filePath);
                song.SongFingerprint ??= new()
                {
                    JobId = jobId
                };

                song.SongFingerprint.FingerprintId = fingerPrintId;
                song.SongFingerprint.Filename = filename;


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
