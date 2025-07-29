using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Metadata
{
    public class MetadataService(IDiscogsService discogsService) : IMetadataService
    {
        public async Task<AlbumDto?> GetMetadataForAlbumAsync(string artist, string album)
        {
            var release = await discogsService.GetReleaseAsync(artist, album);
            if (release == null)
                return null;
            return new AlbumDto()
            {
                Artist = artist,
                Title = release.Title,
                AlbumImageFilename = release.Images.FirstOrDefault(i => i.Type == "primary")?.Uri,
                Songs = release.Tracklist
                    .OrderBy(t => ParseTrackPosition(t.Position).side)
                    .ThenBy(t => ParseTrackPosition(t.Position).track)
                    .Select((s, i) => new SongDto()
                    {
                        Duration = GetDurationInSeconds(s.Duration),
                        Name = s.Title,
                        Position = i + 1,
                    })
            };
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
