using System.Text.Json;
using System.Text.Json.Serialization;

namespace VisualAudio.Services.Metadata.Lyrics
{
    public class MusixMatchService : IMusixMatchService
    {
        public string Name => "MusixMatch";
        private readonly MusixMatchAPI _api = new();

        public async Task<LyricResult?> SearchAsync(SearchSongInfo info)
        {
            await _api.Reinit();

            var data = await _api.Query("macro.subtitles.get", new Dictionary<string, string>
            {
                { "q_track", info.Title },
                { "q_artist", info.Artist },
                { "q_duration", info.SongDuration.ToString() },
                { "namespace", "lyrics_richsynched" },
                { "subtitle_format", "lrc" }
            });

            if (data == null || !data.MacroCalls.ContainsKey("matcher.track.get"))
                return null;

            var track = data.MacroCalls["matcher.track.get"]?.Message?.Body?.Track;
            var lyrics = data.MacroCalls["track.lyrics.get"]?.Message?.Body?.Lyrics?.LyricsBody;
            var subtitle = data.MacroCalls["track.subtitles.get"]?.Message?.Body?.SubtitleList?.FirstOrDefault()?.Subtitle;

            // invalid result
            if (track == null || track.TrackId == 115264642) return null;

            return new LyricResult
            {
                Title = track.TrackName,
                Artists = new List<string> { track.ArtistName },
                Lyrics = lyrics,
                SyncedLyrics = subtitle?.SubtitleBody
            };
        }
    }

    // ---------- API ----------
    public class MusixMatchAPI
    {
        private readonly HttpClient _http = new();
        private string _cookie = "x-mxm-user-id=";
        private string? _token;
        private long _tokenExpiration = 0; // <-- ahora guardamos la expiración en memoria
        private const string BaseUrl = "https://apic-desktop.musixmatch.com/ws/1.1/";
        private const string AppId = "web-desktop-app-v1.0";

        public MusixMatchAPI()
        {
            _http.DefaultRequestHeaders.Add("Authority", "apic-desktop.musixmatch.com");
        }

        public async Task Reinit()
        {
            if (_token == null || DateTimeOffset.Now.ToUnixTimeMilliseconds() > _tokenExpiration)
                await Init();
        }

        public async Task<MacroResponse?> Query(string endpoint, Dictionary<string, string> parameters)
        {
            await Reinit();
            if (_token == null) throw new Exception("Token not initialized");

            var query = new Dictionary<string, string>(parameters)
            {
                { "app_id", AppId },
                { "format", "json" },
                { "usertoken", _token }
            };

            var url = $"{BaseUrl}{endpoint}?{string.Join("&", query.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"))}";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Cookie", _cookie);

            var response = await _http.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
                _cookie = cookies.FirstOrDefault() ?? _cookie;

            var parsed = JsonSerializer.Deserialize<ApiWrapper<MacroResponse>>(content);
            if (parsed?.Message?.Body == null) return null;

            // if unauthorized, refresh token
            if (parsed.Message.Header.StatusCode == 401)
            {
                _token = null;
                await Init();
                return await Query(endpoint, parameters);
            }

            return parsed.Message.Body;
        }

        private async Task Init()
        {
            var endpoint = "token.get";
            var url = $"{BaseUrl}{endpoint}?app_id={AppId}";
            var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("Cookie", _cookie);

            var resp = await _http.SendAsync(req);
            var jsonResp = await resp.Content.ReadAsStringAsync();

            if (resp.Headers.TryGetValues("Set-Cookie", out var cookies))
                _cookie = cookies.FirstOrDefault() ?? _cookie;

            var parsed = JsonSerializer.Deserialize<ApiWrapper<TokenResponse>>(jsonResp);
            _token = parsed?.Message?.Body?.UserToken ?? "";

            if (string.IsNullOrEmpty(_token)) throw new Exception("Failed to get token");

            // el token dura 1 minuto
            _tokenExpiration = DateTimeOffset.Now.ToUnixTimeMilliseconds() + 60_000;
        }
    }

    // ---------- Models ----------
    public class ApiWrapper<T>
    {
        [JsonPropertyName("message")]
        public ApiMessage<T>? Message { get; set; }
    }

    public class ApiMessage<T>
    {
        [JsonPropertyName("header")]
        public ApiHeader Header { get; set; } = new();

        [JsonPropertyName("body")]
        public T? Body { get; set; }
    }

    public class ApiHeader
    {
        [JsonPropertyName("status_code")]
        public int StatusCode { get; set; }
    }

    public class MacroResponse
    {
        [JsonPropertyName("macro_calls")]
        public Dictionary<string, MacroCall>? MacroCalls { get; set; } = new();
    }

    public class MacroCall
    {
        [JsonPropertyName("message")]
        public MacroMessage? Message { get; set; }
    }

    public class MacroMessage
    {
        [JsonPropertyName("body")]
        public MacroBody? Body { get; set; }
    }

    public class MacroBody
    {
        [JsonPropertyName("track")]
        public Track? Track { get; set; }

        [JsonPropertyName("lyrics")]
        public Lyrics? Lyrics { get; set; }

        [JsonPropertyName("subtitle_list")]
        public List<SubtitleWrapper>? SubtitleList { get; set; }
    }

    public class Track
    {
        [JsonPropertyName("track_id")]
        public int TrackId { get; set; }

        [JsonPropertyName("track_name")]
        public string TrackName { get; set; } = "";

        [JsonPropertyName("artist_name")]
        public string ArtistName { get; set; } = "";
    }

    public class Lyrics
    {
        [JsonPropertyName("lyrics_body")]
        public string LyricsBody { get; set; } = "";
    }

    public class SubtitleWrapper
    {
        [JsonPropertyName("subtitle")]
        public Subtitle Subtitle { get; set; } = new();
    }

    public class Subtitle
    {
        [JsonPropertyName("subtitle_body")]
        public string SubtitleBody { get; set; } = "";
    }

    public class TokenResponse
    {
        [JsonPropertyName("user_token")]
        public string? UserToken { get; set; }
    }

    public class SearchSongInfo
    {
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public string? Album { get; set; }
        public int SongDuration { get; set; }
    }
}
