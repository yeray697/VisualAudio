
using Microsoft.Extensions.Logging;

using VisualAudio.Services.Albums.Models;

namespace VisualAudio.Services.Metadata.Lyrics
{
    public class LyricsService(ILrcLibLyricsService lrcLibLyricsService, IMusixMatchService musixMatchService, ILogger<LyricsService> logger) : ILyricsService
    {
        public async Task<string?> GetLyricsAsync(string songName, int songDuration, AlbumDto album)
        {
            logger.LogInformation("Retrieving lyrics using LrcLib {Artist} - {Name} - {Album} ({Duration})", album.Artist, songName, album.Title, songDuration);
            (var syncedLyrics, var lrcLibLyrics) = await GetLrcLibAsync(songName, songDuration, album);

            // if synced lyrics found, return it
            if (!string.IsNullOrEmpty(syncedLyrics))
                return syncedLyrics;

            // musixMatch fallback
            logger.LogInformation("Retrieving lyrics using MusixMatch for {Artist} - {Name} - {Album} ({Duration})", album.Artist, songName, album.Title, songDuration);
            (syncedLyrics, var lyrics) = await GetFromMusixMatchAsync(songName, songDuration, album);

            // if synced lyrics found, return it
            if (!string.IsNullOrEmpty(syncedLyrics))
                return syncedLyrics;
            // else return first (not synced) lyrics
            if (!string.IsNullOrEmpty(lrcLibLyrics))
                return lrcLibLyrics;

            // or musixmatch lyrics
            return lyrics;
        }

        public async Task<(string?, string?)> GetLrcLibAsync(string songName, int songDuration, AlbumDto album)
        {
            try
            {
                var response = await lrcLibLyricsService.SearchAsync(
                    songName,
                    album.Artist,
                    album.Title,
                    songDuration
                );
                if (response == null)
                    return (null, null);
                return (response.SyncedLyrics, response.Lyrics);
            }
            catch (Exception e)
            {
                logger.LogWarning("An error has occurred searching lyrics on LRCLIB for {Artist} - {Name} - {Album} ({Duration})", album.Artist, songName, album.Title, songDuration);
                return (null, null);
            }
        }
        public async Task<(string?, string?)> GetFromMusixMatchAsync(string songName, int songDuration, AlbumDto album)
        {
            try
            {
                var response = await musixMatchService.SearchAsync(
                    new()
                    {
                        Album = album.Title,
                        Artist = album.Artist,
                        SongDuration = songDuration,
                        Title = songName
                    }
                );
                if (response == null)
                    return (null, null);

                return (response.SyncedLyrics, response.Lyrics);
            }
            catch (Exception e)
            {
                logger.LogWarning("An error has occurred searching lyrics on LRCLIB for {Artist} - {Name} - {Album} ({Duration})", album.Artist, songName, album.Title, songDuration);
                return (null, null);
            }
        }

    }
}
