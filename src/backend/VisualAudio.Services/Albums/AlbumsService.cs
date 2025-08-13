using VisualAudio.Services.Albums.Models;
using VisualAudio.Data.Albums;
using VisualAudio.Data.Albums.Models;
using VisualAudio.Services.Fingerprint;

namespace VisualAudio.Services.Albums
{
    public class AlbumsService(IFingerprintService fingerprintService, IAlbumRepository albumRepository, IAlbumMetadataRepository albumMetadataRepository) : IAlbumsService
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
                var newSong = existing.Songs.FirstOrDefault(es => es.Id == s.Id) ?? new Song();
                newSong.CreatedAt = s.CreatedAt;
                newSong.Duration = s.Duration;
                newSong.Id = s.Id;
                newSong.Name = s.Name;
                newSong.Position = s.Position;
                newSong.UpdatedAt = s.UpdatedAt;
                //SongImageFilename = s.SongImageFilename
                //SongFilename = s.SongFilename
                //SongLyricsFilename = s.SongLyricsFilename;

                return newSong;
            }).ToList();
            await albumRepository.UpdateAlbumAsync(id, existing);
        }

        public async Task DeleteAlbumAsync(string id)
        {
            var album = await GetAlbumAsync(id);
            var fingerPrints = album?.Songs.Where(s => !string.IsNullOrEmpty(s.FingerprintId)).Select(s => s.FingerprintId!) ?? [];
            foreach (var fingerprintId in fingerPrints)
            {
                fingerprintService.DeleteTrack(fingerprintId);
            }
            await albumRepository.DeleteAlbumAsync(id); //This already delete metadata files
        }

        public async Task DeleteMetadataFileAsync(MetadataFileType fileType, string albumId, string? songId = null)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;
            if (fileType == MetadataFileType.AlbumImage)
            {
                filename = album.AlbumImageFilename;
                album.AlbumImageFilename = null;
            }
            else
            {
                var song = album.Songs.First(s => s.Id == songId);
                if (fileType == MetadataFileType.Song)
                {
                    filename = song.SongFilename;
                    song.SongFilename = null;
                }
                else if (fileType == MetadataFileType.SongImage)
                {
                    filename = song.SongImageFilename;
                    song.SongImageFilename = null;
                }
                else if (fileType == MetadataFileType.SongLyrics)
                {
                    filename = song.SongLyricsFilename;
                    song.SongLyricsFilename = null;
                }
                else if (fileType == MetadataFileType.SongVideo)
                {
                    filename = song.SongVideoFilename;
                    song.SongVideoFilename = null;
                }
            }
            if (!string.IsNullOrEmpty(filename))
            {
                var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
                await albumMetadataRepository.DeleteFileForAlbumAsync(identifier);
                await albumRepository.UpdateAlbumAsync(albumId, album);
            }
        }
        public async Task UpdateVideoSongAsync(string albumId, string songId, string filename)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);

            var song = album.Songs.First(s => s.Id == songId);
            song.SongVideoFilename = filename;

            await albumRepository.UpdateAlbumAsync(albumId, album);

        }

        public async Task UpsertMetadataFileAsync(MetadataFileType fileType, string fileExtension, Stream content, string albumId, string? songId = null)
        {
            var filename = GetFilename(fileType, fileExtension);
            var album = await albumRepository.GetAlbumAsync(albumId);
            var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
            await albumMetadataRepository.UpsertFileForAlbumAsync(identifier, content);
            if (fileType == MetadataFileType.AlbumImage)
            {
                album.AlbumImageFilename = filename;
            }
            else
            {
                var song = album.Songs.First(s => s.Id == songId);
                if (fileType == MetadataFileType.SongImage)
                    song.SongImageFilename = filename;
                else if (fileType == MetadataFileType.SongLyrics)
                    song.SongLyricsFilename = filename;
                else if (fileType == MetadataFileType.Song)
                {
                    song.SongFilename = filename;
                    var convertedTmpPath = await fingerprintService.ConvertToWavAsync(content);
                    var fingerPrintId = await fingerprintService.StoreTrack(convertedTmpPath, album.Artist, song.Name, song.Id, album.Title, album.Id);
                    song.FingerprintId = fingerPrintId;
                }

            }
            await albumRepository.UpdateAlbumAsync(albumId, album);

        }

        public async Task<Stream?> GetMetadataFileAsync(MetadataFileType fileType, string albumId, string? songId = null)
        {
            var album = await albumRepository.GetAlbumAsync(albumId);
            string? filename = null;
            if (fileType == MetadataFileType.AlbumImage)
                filename = album.AlbumImageFilename;
            else
            {
                var song = album.Songs.First(s => s.Id == songId);
                if (fileType == MetadataFileType.SongImage)
                    filename = song.SongImageFilename;
                else if (fileType == MetadataFileType.Song)
                    filename = song.SongFilename;
                else if (fileType == MetadataFileType.SongLyrics)
                    filename = song.SongLyricsFilename;
            }
            if (filename == null)
                return null;
            var identifier = GetAlbumMetadataIdentifier(filename, albumId, songId);
            return await albumMetadataRepository.GetFileForAlbumAsync(identifier);
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
                    Position = s.Position,
                    UpdatedAt = s.UpdatedAt,
                    SongImageFilename = s.SongImageFilename,
                    SongFilename = s.SongFilename,
                    SongLyricsFilename = s.SongLyricsFilename,
                    SongVideoFilename = s.SongVideoFilename,
                    FingerprintId = s.FingerprintId
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
                    SongImageFilename = s.SongImageFilename,
                    SongFilename = s.SongFilename,
                    SongLyricsFilename = s.SongLyricsFilename,
                    SongVideoFilename = s.SongVideoFilename,
                    FingerprintId = s.FingerprintId,
                    Position = s.Position,
                    UpdatedAt = s.UpdatedAt,
                })
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
