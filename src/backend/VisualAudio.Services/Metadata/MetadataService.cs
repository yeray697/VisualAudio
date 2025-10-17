using VisualAudio.Services.Metadata.Lyrics;
using VisualAudio.Services.Metadata.Models;
using VisualAudio.Services.Video;

namespace VisualAudio.Services.Metadata
{
    public class MetadataService(IDiscogsService discogsService, ILyricsService lyricsService) : IMetadataService
    {
        public async Task<AlbumMetadataDto?> GetMetadataForAlbumAsync(string artist, string album)
        {
            // await videoDownloader.DownloadVideo(new()
            // {
            //     AlbumId = "cf867741-cfd6-4213-bb3f-ef914891df71",
            //     SongId = "81c0c0df-2635-4c26-b75f-24bc2e9eb36c",
            //     Filename = "song-video",
            //     VideoUrl = "https://www.youtube.com/watch?v=yG96RttfZtM",
            //     VideoSegments = [new() { Start = 3.5, End = 184 }]
            // });
            var release = await discogsService.GetReleaseAsync(artist, album);
            if (release == null)
                return null;
            var albumDto = new AlbumMetadataDto()
            {
                Artist = artist,
                Title = release.Title,
                AlbumImageFilename = release.Images.FirstOrDefault(i => i.Type == "primary")?.Uri,
                RelatedVideos = release.Videos.Select(v => new RelatedVideos()
                {
                    Description = v.Description,
                    Duration = v.Duration,
                    Title = v.Title,
                    Uri = v.Uri
                }).ToList(),
                Songs = release.Tracklist
                    .OrderBy(t => ParseTrackPosition(t.Position).side)
                    .ThenBy(t => ParseTrackPosition(t.Position).track)
                    .Select((s, i) => new SongMetadataDto()
                    {
                        Artist = string.Join(", ", s.Extraartists.Where(a => a.Role == "Featuring").Select(a => a.Name).Prepend(artist)),
                        Duration = GetDurationInSeconds(s.Duration),
                        Name = s.Title,
                        Position = i + 1
                    }).ToList()
            };


            foreach (var song in albumDto.Songs)
            {
                song.Lyrics = await lyricsService.GetLyricsAsync(song.Name, song.Duration, albumDto);
            }

            return albumDto;
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
        public static (int side, int track) ParseTrackPosition(string? position)
        {
            if (string.IsNullOrWhiteSpace(position))
                return (int.MaxValue, int.MaxValue); // Si no hay posición, lo mandamos al final

            // Ejemplo: "A1" → letra = A, número = 1
            var letterPart = new string(position.TakeWhile(char.IsLetter).ToArray());
            var numberPart = new string(position.SkipWhile(char.IsLetter).ToArray());

            int side = !string.IsNullOrEmpty(letterPart)
                ? char.ToUpper(letterPart[0]) - 'A' + 1
                : 0;

            int track = int.TryParse(numberPart, out var n) ? n : 0;

            return (side, track);
        }

    }
}
