using System.Text.Json;

using F23.StringSimilarity;

using Microsoft.Extensions.Configuration;

namespace VisualAudio.Services.Metadata;
public class DiscogsService : IDiscogsService
{
    private readonly JaroWinkler _jw = new();
    private readonly HttpClient _httpClient;
    private readonly string _username;
    private readonly static JsonSerializerOptions jsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public DiscogsService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        var token = config["Discogs:Token"] ?? throw new Exception("Discogs token missing in configuration");
        _username = config["Discogs:Username"] ?? throw new Exception("Discogs Username missing in configuration");
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

        return await GetReleaseAsync(releasesFiltered[0].Id);
    }
    public async Task<DiscogsRelease?> GetReleaseAsync(int releaseId)
    {
        var releaseUrl = $"https://api.discogs.com/releases/{releaseId}";
        var releaseResponse = await _httpClient.GetAsync(releaseUrl);
        releaseResponse.EnsureSuccessStatusCode();
        using var releaseStream = await releaseResponse.Content.ReadAsStreamAsync();
        var release = await JsonSerializer.DeserializeAsync<DiscogsRelease>(releaseStream, jsonSerializerOptions);

        return release;
    }

    public async Task<List<int>> GetMyCollectionReleaseIdsAsync()
    {
        var releaseIds = new List<int>();
        int page = 1;
        bool hasMore = true;

        while (hasMore)
        {
            var url = $"https://api.discogs.com/users/{_username}/collection/folders/0/releases?page={page}&per_page=100";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var data = JsonSerializer.Deserialize<DiscogsCollectionResponse>(json, jsonSerializerOptions);

            if (data?.Releases == null || data.Releases.Count == 0)
                break;

            releaseIds.AddRange(data.Releases.Select(r => r.Basic_Information.Id));

            hasMore = data.Pagination.Page < data.Pagination.Pages;
            page++;
        }

        return releaseIds;
    }


    private static (string artist, string album) ParseTitle(string title)
    {
        var parts = title.Split(" - ", 2);
        if (parts.Length == 2)
            return (parts[0].Trim(), parts[1].Trim());
        return ("", title);
    }

    private double SimilarityScore(string a, string b)
    {
        return _jw.Similarity(a.ToLowerInvariant(), b.ToLowerInvariant());
    }

    private List<DiscogsSearchResult> FilterAndSort(List<DiscogsSearchResult>? releases, string searchArtist, string searchAlbum)
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


public class DiscogsSearchResponse
{
    public List<DiscogsSearchResult> Results { get; set; } = [];
}

public class DiscogsSearchResult
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required List<string> Format { get; set; }
}

public class DiscogsRelease
{
    public DiscogsArtists[] Artists { get; set; } = [];
    public required string Title { get; set; }
    public required string Country { get; set; }
    public required string Released { get; set; }
    public required List<DiscogsImage> Images { get; set; }
    public required List<DiscogsTrack> Tracklist { get; set; }
    public required List<DicogsVideos> Videos { get; set; }
}

public class DiscogsImage
{
    public required string Uri { get; set; }
    public required string Resource_Url { get; set; }
    public required string Type { get; set; }
}

public class DicogsVideos
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Uri { get; set; }
    public int Duration { get; set; }
}

public class DiscogsTrack
{
    public required string Title { get; set; }
    public required string Duration { get; set; }
    public required string Position { get; set; }
    public DiscogsArtists[] Extraartists { get; set; } = [];
}

public class DiscogsArtists
{
    public required string Name { get; set; }
    public required string Role { get; set; }
}




public class DiscogsCollectionResponse
{
    public required Pagination Pagination { get; set; }
    public required List<DiscogsCollectionItem> Releases { get; set; }
}

public class Pagination
{
    public int Page { get; set; }
    public int Pages { get; set; }
    public int Per_Page { get; set; }
    public int Items { get; set; }
}

public class DiscogsCollectionItem
{
    public required BasicInformation Basic_Information { get; set; }
}

public class BasicInformation
{
    public int Id { get; set; }  // ReleaseId
    public required string Title { get; set; }
    public required List<Artist> Artists { get; set; }
}

public class Artist
{
    public required string Name { get; set; }
}