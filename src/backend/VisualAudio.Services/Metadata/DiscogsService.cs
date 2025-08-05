using System.Text.Json;

using F23.StringSimilarity;

using Microsoft.Extensions.Configuration;

namespace VisualAudio.Services.Metadata
{
    public class DiscogsService : IDiscogsService
    {
        private readonly JaroWinkler _jw = new JaroWinkler();
        private readonly HttpClient _httpClient;
        private static JsonSerializerOptions jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        public DiscogsService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            var token = config["Discogs:Token"] ?? throw new Exception("Discogs token missing in configuration");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "VisualAudio/1.0 (https://yeray697.dev)");
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Discogs token={token}");

        }

        public async Task<DiscogsRelease?> GetReleaseAsync(string artist, string album)
        {
            var searchUrl = $"https://api.discogs.com/database/search?q={Uri.EscapeDataString(album)}&artist={Uri.EscapeDataString(artist)}&type=release";
            var searchResponse = await _httpClient.GetAsync(searchUrl);
            searchResponse.EnsureSuccessStatusCode();

            // using var searchStream = await searchResponse.Content.ReadAsStreamAsync();
            // var searchJson = await JsonSerializer.DeserializeAsync<DiscogsSearchResponse>(searchStream, jsonSerializerOptions);

            var searchStream = await searchResponse.Content.ReadAsStringAsync();
            var releases = JsonSerializer.Deserialize<DiscogsSearchResponse>(searchStream, jsonSerializerOptions);
            var releasesFiltered = FilterAndSort(releases?.Results, artist, album);

            if (releasesFiltered == null || releasesFiltered.Count == 0)
                return null;

            var releaseId = releasesFiltered[0].Id;

            // 2. Obtener detalles del release
            var releaseUrl = $"https://api.discogs.com/releases/{releaseId}";
            var releaseResponse = await _httpClient.GetAsync(releaseUrl);
            releaseResponse.EnsureSuccessStatusCode();
            var stringJson = await releaseResponse.Content.ReadAsStringAsync();
            using var releaseStream = await releaseResponse.Content.ReadAsStreamAsync();
            var release = await JsonSerializer.DeserializeAsync<DiscogsRelease>(releaseStream, jsonSerializerOptions);

            return release;
        }


        private (string artist, string album) ParseTitle(string title)
        {
            var parts = title.Split(" - ", 2);
            if (parts.Length == 2)
                return (parts[0].Trim(), parts[1].Trim());
            return ("", title);
        }

        // Calcula similitud promedio entre artista y álbum
        private double SimilarityScore(string a, string b)
        {
            return _jw.Similarity(a.ToLowerInvariant(), b.ToLowerInvariant());
        }

        public List<DiscogsSearchResult> FilterAndSort(List<DiscogsSearchResult>? releases, string searchArtist, string searchAlbum)
        {
            if (releases == null || releases.Count == 0)
                return [];
            // Primero filtramos por similitud mínima (p.ej. 0.7)
            var filtered = releases
            .Select(r =>
            {
                var (artist, album) = ParseTitle(r.Title);
                var artistScore = SimilarityScore(artist, searchArtist);
                var albumScore = SimilarityScore(album, searchAlbum);
                var combinedScore = (artistScore + albumScore) / 2;
                return new { Release = r, Score = combinedScore, ArtistScore = artistScore, AlbumScore = albumScore };
            })
            .Where(x => x.Score > 0.7)
            .ToList();

            // Ordenamos: primero por formato preferido, luego por score descendente
            var formatOrder = new List<string> { "CD", "CDr", "File", "Digital", "Vinyl", "LP", "EP" };

            var sorted = filtered
                .OrderBy(x =>
                {
                    var idx = formatOrder.FindIndex(f => x.Release.Format.Any(e => e.Contains(f, StringComparison.OrdinalIgnoreCase)));
                    return idx < 0 ? int.MaxValue : idx;
                })
                .ThenByDescending(x => x.Score)
                .Select(x => x.Release)
                .ToList();


            return sorted;
        }
    }
}


public class DiscogsSearchResponse
{
    public List<DiscogsSearchResult> Results { get; set; } = new();
}

public class DiscogsSearchResult
{
    public int Id { get; set; }
    public string Title { get; set; }
    public List<string> Format { get; set; }
}

public class DiscogsRelease
{
    public string Title { get; set; }
    public string Country { get; set; }
    public string Released { get; set; }
    public List<DiscogsImage> Images { get; set; }
    public List<DiscogsTrack> Tracklist { get; set; }
}

public class DiscogsImage
{
    public string Uri { get; set; }
    public string Resource_Url { get; set; }
    public string Type { get; set; }
}

public class DiscogsTrack
{
    public string Title { get; set; }
    public string Duration { get; set; }
    public string Position { get; set; }
    public DiscogsArtists[] Extraartists { get; set; } = [];
}

public class DiscogsArtists
{
    public string Name { get; set; }
    public string Role { get; set; }
}
