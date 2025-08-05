using System.Text.Json;
using System.Web;

using F23.StringSimilarity;

namespace VisualAudio.Services.Metadata.Lyrics
{
    public class LrcLibLyricsService(HttpClient _http) : ILrcLibLyricsService
    {
        private readonly JaroWinkler _similarity = new();
        JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        public async Task<LrcLibResult?> SearchAsync(
            string title,
            string artist,
            string? album,
            int songDuration)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            query["artist_name"] = artist;
            query["track_name"] = title;
            if (!string.IsNullOrWhiteSpace(album))
                query["album_name"] = album;

            var url = $"https://lrclib.net/api/search?{query}";

            var data = await FetchResults(url);
            if (data == null || data.Count == 0)
                return null;

            var filteredResults = new List<LrcLibSearchResponse>();
            var inputArtists = artist.Split(new[] { '&', ',' }, StringSplitOptions.RemoveEmptyEntries)
                                     .Select(a => a.Trim()).ToList();

            foreach (var item in data)
            {
                var itemArtists = item.ArtistName.Split(new[] { '&', ',' }, StringSplitOptions.RemoveEmptyEntries)
                                                .Select(a => a.Trim()).ToList();

                var permutations = (from a in inputArtists from b in itemArtists select (a.ToLower(), b.ToLower())).ToList();
                var ratio = permutations.Max(p => _similarity.Similarity(p.Item1, p.Item2));

                if (ratio > 0.9)
                    filteredResults.Add(item);
            }

            if (filteredResults.Count == 0)
                return null;

            // Ordenar por duración más cercana
            filteredResults = filteredResults.OrderBy(r => Math.Abs(r.Duration - songDuration)).ToList();
            var closest = filteredResults.First();

            if (Math.Abs(closest.Duration - songDuration) > 15) return null;
            if (closest.Instrumental) return null;
            if (string.IsNullOrWhiteSpace(closest.SyncedLyrics) && string.IsNullOrWhiteSpace(closest.PlainLyrics))
                return null;

            return new LrcLibResult
            {
                Title = closest.TrackName,
                Artists = closest.ArtistName.Split(new[] { '&', ',' }, StringSplitOptions.RemoveEmptyEntries),
                Lyrics = closest.PlainLyrics,
                SyncedLyrics = closest.SyncedLyrics
            };
        }

        private async Task<List<LrcLibSearchResponse>?> FetchResults(string url)
        {
            var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode) return null;
            string json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<List<LrcLibSearchResponse>>(json, jsonSerializerOptions);
            return data;
        }
    }
}
