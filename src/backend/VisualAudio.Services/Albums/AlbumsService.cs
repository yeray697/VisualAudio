using VisualAudio.Data.Albums;
using VisualAudio.Data.Albums.Models;
using VisualAudio.Services.Albums.Models;
using VisualAudio.Services.Fingerprint;

namespace VisualAudio.Services.Albums
{
    public class AlbumsService(IFingerprintService fingerprintService, IAlbumRepository albumRepository) : IAlbumsService
    {
        public async Task CreateAlbumAsync(AlbumDto album)
        {
            await albumRepository.CreateAlbumAsync(MapAlbumFromDto(album));
        }

        public async Task<AlbumDto?> GetAlbumAsync(string id)
        {
            var album = await albumRepository.GetAlbumAsync(id);
            if (album == null)
                return null;
            return MapAlbumToDto(album);
        }

        public async Task<IEnumerable<AlbumDto>> GetAllAsync()
        {
            var albums = await albumRepository.GetAllAsync();

            return albums.Select(MapAlbumToDto);
        }

        public async Task UpdateAlbumAsync(string id, AlbumDto album)
        {
            var existing = await albumRepository.GetAlbumAsync(id);
            if (existing == null) throw new FileNotFoundException("Album not found.");

            //Not overriding images. That is handled on a different endpoint/service
            existing.Artist = album.Artist;
            existing.AlbumType = (AlbumType)album.AlbumType;
            existing.CreatedAt = album.CreatedAt;
            existing.Id = album.Id;
            existing.Title = album.Title;
            existing.UpdatedAt = album.UpdatedAt;
            // existing.AlbumImageFilename = album.AlbumImageFilename;
            existing.Songs = album.Songs.Select(s =>
            {
                var newSong = existing.Songs.FirstOrDefault(es => es.Id == s.Id);

                if (newSong == null)
                {
                    newSong = new Song() {
                       CreatedAt = s.CreatedAt,
                       Duration = s.Duration,
                       Id = s.Id,
                       Name = s.Name,
                       Artist = s.Artist,
                       Position = s.Position,
                       UpdatedAt = s.UpdatedAt,
                    };
                }
                else
                {
                    newSong.CreatedAt = s.CreatedAt;
                    newSong.Duration = s.Duration;
                    newSong.Id = s.Id;
                    newSong.Name = s.Name;
                    newSong.Artist = s.Artist;
                    newSong.Position = s.Position;
                    newSong.UpdatedAt = s.UpdatedAt;
                }

                return newSong;
            }).ToList();
            await albumRepository.UpdateAlbumAsync(id, existing);
        }

        public async Task DeleteAlbumAsync(string id)
        {
            var album = await GetAlbumAsync(id);
            var fingerPrints = album?.Songs.Where(s => !string.IsNullOrEmpty(s.SongFingerprint?.FingerprintId)).Select(s => s.SongFingerprint?.FingerprintId!) ?? [];
            foreach (var fingerprintId in fingerPrints)
            {
                fingerprintService.DeleteTrack(fingerprintId);
            }
            await albumRepository.DeleteAlbumAsync(id); //This already delete metadata files
        }

        private static Album MapAlbumFromDto(AlbumDto albumDto)
        {
            return new()
            {
                Artist = albumDto.Artist,
                AlbumType = (AlbumType)albumDto.AlbumType,
                CreatedAt = albumDto.CreatedAt,
                Id = albumDto.Id,
                Title = albumDto.Title,
                UpdatedAt = albumDto.UpdatedAt,
                AlbumImageFilename = albumDto.AlbumImageFilename,
                Songs = albumDto.Songs.Select(s => new Song()
                {
                    CreatedAt = s.CreatedAt,
                    Duration = s.Duration,
                    Id = s.Id,
                    Name = s.Name,
                    Artist = s.Artist,
                    Position = s.Position,
                    UpdatedAt = s.UpdatedAt,
                    SongImageFilename = s.SongImageFilename,
                    SongFingerprint = MapFingerprintFromDto(s.SongFingerprint),
                    SongLyricsFilename = s.SongLyricsFilename,
                    SongVideo = MapVideoFromDto(s.SongVideo),
                })
            };
        }
        private static AlbumDto MapAlbumToDto(Album album)
        {
            return new()
            {
                Artist = album.Artist,
                AlbumType = (AlbumTypeDto)album.AlbumType,
                CreatedAt = album.CreatedAt,
                Id = album.Id,
                Title = album.Title,
                UpdatedAt = album.UpdatedAt,
                AlbumImageFilename = album.AlbumImageFilename,
                Songs = album.Songs.Select(s => new SongDto()
                {
                    CreatedAt = s.CreatedAt,
                    Duration = s.Duration,
                    Id = s.Id,
                    Name = s.Name,
                    Artist = s.Artist,
                    SongImageFilename = s.SongImageFilename,
                    SongFingerprint = MapFingerprintToDto(s.SongFingerprint),
                    SongLyricsFilename = s.SongLyricsFilename,
                    SongVideo = MapVideoToDto(s.SongVideo),
                    Position = s.Position,
                    UpdatedAt = s.UpdatedAt,
                })
            };
        }

        private static VideoDto? MapVideoToDto(Data.Albums.Models.Video? video)
        {
            if (video == null)
                return null;
            return new()
            {
                JobId = video.JobId,
                Filename = video.Filename,
                MaxQuality = video.MaxQuality,
                VideoUrl = video.VideoUrl,
                Segments = ((video.Segments?.Count ?? 0) == 0) ? [] : [.. video.Segments!.Select(s => new VideoDto.VideoSegmentDto()
                {
                    Start = s.Start,
                    End = s.End
                })]
            };
        }

        private static Data.Albums.Models.Video? MapVideoFromDto(VideoDto? video)
        {
            if (video == null)
                return null;
            return new()
            {
                JobId = video.JobId,
                Filename = video.Filename,
                MaxQuality = video.MaxQuality,
                VideoUrl = video.VideoUrl,
                Segments = ((video.Segments?.Count ?? 0) == 0) ? [] : [.. video.Segments!.Select(s => new Data.Albums.Models.Video.VideoSegment()
                {
                    Start = s.Start,
                    End = s.End
                })]
            };
        }

        private static SongFingerprintDto? MapFingerprintToDto(SongFingerprint? song)
        {
            if (song == null)
                return null;
            return new()
            {
                Filename = song.Filename,
                FingerprintId = song.FingerprintId,
                JobId = song.JobId
            };
        }

        private static SongFingerprint? MapFingerprintFromDto(SongFingerprintDto? song)
        {
            if (song == null)
                return null;
            return new()
            {
                Filename = song.Filename,
                JobId = song.JobId,
                FingerprintId = song.FingerprintId
            };
        }

        private static AlbumMetadataIdentifier GetAlbumMetadataIdentifier(string filename, string albumId, string? songId = null)
        {
            return songId == null
                ? AlbumMetadataIdentifier.GetAlbumFileIdentifier(albumId, filename)
                : AlbumMetadataIdentifier.GetSongFileIdentifier(albumId, songId, filename);
        }
        private static string GetFilename(MetadataFileType fileType, string fileExtension)
        {
            var filename = fileType switch
            {
                MetadataFileType.AlbumImage => "album-cover",
                MetadataFileType.Song => "song",
                MetadataFileType.SongImage => "song-cover",
                MetadataFileType.SongLyrics => "song-lyrics",
                _ => throw new NotImplementedException(),
            };
            return $"{filename}{fileExtension}";
        }
    }
}
