
using VisualAudio.Data.Albums;
using VisualAudio.Data.Albums.Models;
using VisualAudio.Jobs.Extensions;
using VisualAudio.Jobs.Handlers;
using VisualAudio.Services.Albums;
using VisualAudio.Services.Albums.Models;
using VisualAudio.Services.Video.Models;

namespace VisualAudio.Jobs.Services
{
    public class MediaAttachmentService(IAlbumRepository albumRepository, IAlbumMetadataRepository albumMetadataRepository, IJobStore jobStore) : IMediaAttachmentService
    {

        public async Task<string?> StartProcessingVideoAsync(VideoRequestDto videoRequestDto)
        {
            var (album, song) = await GetAlbumAndSongAsync(videoRequestDto.AlbumId, videoRequestDto.SongId);
            if (album == null || song == null) return null;

            var jobId = Guid.NewGuid().ToString();
            song.SongVideo = new()
            {
                JobId = jobId,
                MaxQuality = videoRequestDto.MaxQuality,
                VideoUrl = videoRequestDto.VideoUrl,
                Segments = [.. videoRequestDto.Segments.Select(s => new Video.VideoSegment()
                {
                    Start = s.Start,
                    End = s.End
                })]
            };

            var job = await EnqueueJobAsync(jobId, new VideoJobPayload()
            {

                AlbumId = videoRequestDto.AlbumId,
                MaxQuality = videoRequestDto.MaxQuality,
                SongId = videoRequestDto.SongId,
                VideoUrl = videoRequestDto.VideoUrl,
                Segments = [.. videoRequestDto.Segments.Select(s => new VideoJobPayload.VideoSegment()
                {
                    Start = s.Start,
                    End = s.End
                })]
            });

            await albumRepository.UpdateAlbumAsync(album.Id, album);

            return job.Id;
        }

        public async Task<string?> StartProcessingAudioAsync(VideoRequestDto videoRequestDto)
        {
            var (album, song) = await GetAlbumAndSongAsync(videoRequestDto.AlbumId, videoRequestDto.SongId);
            if (album == null || song == null) return null;

            var jobId = Guid.NewGuid().ToString();
            song.SongVideo = new()
            {
                JobId = jobId,
                MaxQuality = videoRequestDto.MaxQuality,
                VideoUrl = videoRequestDto.VideoUrl,
                Segments = [.. videoRequestDto.Segments.Select(s => new Video.VideoSegment()
                {
                    Start = s.Start,
                    End = s.End
                })]
            };

            var job = await EnqueueJobAsync(jobId, new VideoJobPayload()
            {

                AlbumId = videoRequestDto.AlbumId,
                MaxQuality = videoRequestDto.MaxQuality,
                SongId = videoRequestDto.SongId,
                VideoUrl = videoRequestDto.VideoUrl,
                Segments = [.. videoRequestDto.Segments.Select(s => new VideoJobPayload.VideoSegment()
                {
                    Start = s.Start,
                    End = s.End
                })]
            });

            await albumRepository.UpdateAlbumAsync(album.Id, album);

            return job.Id;
        }

        public async Task UploadImage(string albumId, string? songId, string fileExtension, Stream content)
        {
            bool isAlbumFile = string.IsNullOrWhiteSpace(songId);
            var filename =  isAlbumFile ? "album-cover" : "song-cover";
            var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);

            var album = await albumRepository.GetAlbumAsync(albumId);
            await albumMetadataRepository.UpsertFileForAlbumAsync(identifier, content);

            if (isAlbumFile)
            {
                album.AlbumImageFilename = filename;
            }
            else
            {
                var song = album.Songs.First(s => s.Id == songId);
                song.SongImageFilename = filename;
            }
            await albumRepository.UpdateAlbumAsync(albumId, album);
        }

        public async Task DeleteImage(string albumId, string? songId)
        {
            bool isAlbumFile = string.IsNullOrWhiteSpace(songId);
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;
            if (isAlbumFile)
            {
                filename = album.AlbumImageFilename;
                album.AlbumImageFilename = null;
            }
            else
            {
                var song = album.Songs.First(s => s.Id == songId);
                filename = song.SongImageFilename;
                song.SongImageFilename = null;
            }

            if (!string.IsNullOrEmpty(filename))
            {
                var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
                await albumMetadataRepository.DeleteFileForAlbumAsync(identifier);
                await albumRepository.UpdateAlbumAsync(albumId, album);
            }
        }

        public async Task DeleteSongAsync(string albumId, string songId)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;

            var song = album?.Songs.FirstOrDefault(s => s.Id == songId);
            if (song?.SongFingerprint == null)
                return;
            filename = song.SongFingerprint.Filename;
            song.SongFingerprint = null;

            if (!string.IsNullOrEmpty(filename))
            {
                var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
                await albumMetadataRepository.DeleteFileForAlbumAsync(identifier);
                await albumRepository.UpdateAlbumAsync(albumId, album!);
                //TODO delete fingerprint
            }
        }
        public async Task DeleteVideoAsync(string albumId, string songId)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;

            var song = album?.Songs.FirstOrDefault(s => s.Id == songId);
            if (song?.SongVideo == null)
                return;
            filename = song.SongVideo.Filename;
            song.SongVideo = null;

            if (!string.IsNullOrEmpty(filename))
            {
                var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
                await albumMetadataRepository.DeleteFileForAlbumAsync(identifier);
                await albumRepository.UpdateAlbumAsync(albumId, album!);
            }
        }
        public async Task DeleteLyricsAsync(string albumId, string songId)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;

            var song = album?.Songs.FirstOrDefault(s => s.Id == songId);
            if (song?.SongLyricsFilename == null)
                return;

            filename = song.SongLyricsFilename;
            song.SongLyricsFilename = null;

            if (!string.IsNullOrEmpty(filename))
            {
                var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
                await albumMetadataRepository.DeleteFileForAlbumAsync(identifier);
                await albumRepository.UpdateAlbumAsync(albumId, album!);
            }
        }

        private async Task<Job> EnqueueJobAsync<T>(string jobId, T payload)
        {
            var job = new Job
            {
                Id = jobId,
                Status = JobStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            job.SetPayload(payload);

            await jobStore.EnqueueAsync(job);

            return job;
        }

        private static AlbumMetadataIdentifier GetAlbumMetadataIdentifier(string filename, string albumId, string? songId = null)
        {
            return songId == null
                ? AlbumMetadataIdentifier.GetAlbumFileIdentifier(albumId, filename)
                : AlbumMetadataIdentifier.GetSongFileIdentifier(albumId, songId, filename);
        }

        private async Task<(Album?, Song?)> GetAlbumAndSongAsync(string albumId, string songId)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            return (album, album?.Songs.FirstOrDefault(s => s.Id == songId));
        }
    }

}
