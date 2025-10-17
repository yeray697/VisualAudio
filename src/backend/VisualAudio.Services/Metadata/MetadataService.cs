using VisualAudio.Services.Albums;
using VisualAudio.Services.Albums.Models;
using VisualAudio.Services.Metadata.Lyrics;
using VisualAudio.Services.Metadata.Models;

namespace VisualAudio.Services.Metadata
{
    public class MetadataService(IDiscogsService discogsService, ILyricsService lyricsService, IAlbumsService albumsService) : IMetadataService
    {
        public async Task<AlbumMetadataDto?> GetMetadataForAlbumAsync(string artist, string album)
        {
            var release = await discogsService.GetReleaseAsync(artist, album);
            if (release == null)
                return null;
            var albumDto = new AlbumMetadataDto()
            {
                Artist = artist,
                Title = release.Title,
                AlbumImageFilename = release.Images.FirstOrDefault(i => i.Type == "primary")?.Uri,
                RelatedVideos = [.. release.Videos.Select(v => new RelatedVideos()
                {
                    Description = v.Description,
                    Duration = v.Duration,
                    Title = v.Title,
                    Uri = v.Uri
                })],
                Songs = [.. release.Tracklist
                    .OrderBy(t => ParseTrackPosition(t.Position).side)
                    .ThenBy(t => ParseTrackPosition(t.Position).track)
                    .Select((s, i) => new SongMetadataDto()
                    {
                        Artist = string.Join(", ", s.Extraartists.Where(a => a.Role == "Featuring").Select(a => a.Name).Prepend(artist)),
                        Duration = GetDurationInSeconds(s.Duration),
                        Name = s.Title,
                        Position = i + 1
                    })]
            };


            foreach (var song in albumDto.Songs)
            {
                song.Lyrics = await lyricsService.GetLyricsAsync(song.Name, song.Duration, albumDto);
            }

            return albumDto;
        }

        public async Task SyncWithDiscogsAsync()
        {
            var collection = await albumsService.GetAllAsync();
            var discogsReleaseIds = await discogsService.GetMyCollectionReleaseIdsAsync();
            foreach (var releaseId in discogsReleaseIds)
            {
                var release = await discogsService.GetReleaseAsync(releaseId);
                if (release == null)
                    continue;
                string artist = release.Artists.FirstOrDefault()?.Name ?? "Unknown";
                var albumDto = new AlbumDto()
                {
                    Artist = artist,
                    Title = release.Title,
                    AlbumImageFilename = release.Images.FirstOrDefault(i => i.Type == "primary")?.Uri,
                    Songs = [.. release.Tracklist
                    .OrderBy(t => ParseTrackPosition(t.Position).side)
                    .ThenBy(t => ParseTrackPosition(t.Position).track)
                    .Select((s, i) => new SongMetadataDto()
                    {
                        Artist = string.Join(", ", s.Extraartists.Where(a => a.Role == "Featuring").Select(a => a.Name).Prepend(artist)),
                        Duration = GetDurationInSeconds(s.Duration),
                        Name = s.Title,
                        Position = i + 1
                    })]
                };
                //todo albumimagefilename

                // Skip if already present
                if (collection.Any(a =>
                    a.Title.Equals(albumDto.Title, StringComparison.InvariantCultureIgnoreCase)
                    && a.Artist.Equals(albumDto.Artist, StringComparison.InvariantCultureIgnoreCase))
                )
                    continue;

                await albumsService.CreateAlbumAsync(albumDto);
            }
        }

        private static int GetDurationInSeconds(string duration)
        {
            if (string.IsNullOrWhiteSpace(duration)) return 0;
            var parts = duration.Split(':');
            if (parts.Length != 2) return 0;

            if (int.TryParse(parts[0], out var minutes) && int.TryParse(parts[1], out var seconds))
                return minutes * 60 + seconds;

            return 0;
        }

        private static (int side, int track) ParseTrackPosition(string? position)
        {
            if (string.IsNullOrWhiteSpace(position))
                return (int.MaxValue, int.MaxValue); // Si no hay posición, lo mandamos al final

            // Ejemplo: "A1" → letra = A, número = 1
            var letterPart = new string([.. position.TakeWhile(char.IsLetter)]);
            var numberPart = new string([.. position.SkipWhile(char.IsLetter)]);

            int side = !string.IsNullOrEmpty(letterPart)
                ? char.ToUpper(letterPart[0]) - 'A' + 1
                : 0;

            int track = int.TryParse(numberPart, out var n) ? n : 0;

            return (side, track);
        }

    }
}
