using System.Text.Json;

using Microsoft.Extensions.Configuration;

namespace VisualAudio.Services.Metadata
{
    public class DiscogsService : IDiscogsService
    {
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
            var searchUrl = $"https://api.discogs.com/database/search?q={Uri.EscapeDataString(album)}&artist={Uri.EscapeDataString(artist)}&format=CD&type=release";
            var searchResponse = await _httpClient.GetAsync(searchUrl);
            searchResponse.EnsureSuccessStatusCode();

            using var searchStream = await searchResponse.Content.ReadAsStreamAsync();
            var searchJson = await JsonSerializer.DeserializeAsync<DiscogsSearchResponse>(searchStream, jsonSerializerOptions);

            if (searchJson?.Results == null || searchJson.Results.Count == 0)
                return null;

            var releaseId = searchJson.Results[0].Id;

            // 2. Obtener detalles del release
            var releaseUrl = $"https://api.discogs.com/releases/{releaseId}";
            var releaseResponse = await _httpClient.GetAsync(releaseUrl);
            releaseResponse.EnsureSuccessStatusCode();
            var stringJson = await releaseResponse.Content.ReadAsStringAsync();
            using var releaseStream = await releaseResponse.Content.ReadAsStreamAsync();
            var release = await JsonSerializer.DeserializeAsync<DiscogsRelease>(releaseStream, jsonSerializerOptions);

            return release;
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
}
