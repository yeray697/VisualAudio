using Microsoft.AspNetCore.Mvc;

using VisualAudio.Services.Albums;
using VisualAudio.Services.Albums.Models;
using VisualAudio.Services.Metadata;
using VisualAudio.Services.Video.Models;

namespace VisualAudio.Api.Controllers
{
    [ApiController]
    [Route("api/albums")]
    public class AlbumsController(IAlbumsService albumService, IMetadataService metadataService, IMediaAttachmentService mediaAttachmentService) : ControllerBase
    {

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var albums = await albumService.GetAllAsync();
            return Ok(albums);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var album = await albumService.GetAlbumAsync(id);
            if (album == null) return NotFound();
            return Ok(album);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AlbumDto album)
        {
            if (string.IsNullOrEmpty(album.Id))
                album.Id = Guid.NewGuid().ToString();
            await albumService.CreateAlbumAsync(album);
            return Ok(new { id = album.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] AlbumDto album)
        {
            await albumService.UpdateAlbumAsync(id, album);
            return Ok(new { id = album.Id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await albumService.DeleteAlbumAsync(id);
            return NoContent();
        }

        [HttpDelete("{albumId}/file/{fileType}")]
        public async Task<IActionResult> Delete(string albumId, MetadataFileType fileType, [FromQuery] string? songId = null)
        {
            switch (fileType)
            {
                case MetadataFileType.AlbumImage:
                case MetadataFileType.SongImage:
                    await mediaAttachmentService.DeleteImage(albumId, songId);
                    break;
                case MetadataFileType.Song:
                    await mediaAttachmentService.DeleteSongAsync(albumId, songId!);
                    break;
                case MetadataFileType.SongLyrics:
                    await mediaAttachmentService.DeleteLyricsAsync(albumId, songId!);
                    break;
                case MetadataFileType.SongVideo:
                    await mediaAttachmentService.DeleteVideoAsync(albumId, songId!);
                    break;
                default:
                    break;
            }
            return NoContent();
        }

        [HttpPut("{albumId}/file/{fileType}")]
        public async Task<IActionResult> Update([FromForm] IFormFile? file, string albumId, MetadataFileType fileType, [FromQuery] string? songId = null, [FromQuery] string? url = null)
        {
            Stream stream;
            string extension;
            if (string.IsNullOrWhiteSpace(url) && file == null)
            {
                return BadRequest("You must provide a file or an URL.");
            }
            if (!string.IsNullOrWhiteSpace(url) && file != null)
            {
                return BadRequest("You must provide only a file or an URL.");
            }
            else if (file != null)
            {
                stream = file.OpenReadStream();
                extension = Path.GetExtension(file.FileName);
            }
            else
            {
                stream = await DownloadFileAsync(url!);

                extension = Path.GetExtension(new Uri(url!).AbsolutePath);
                if (string.IsNullOrWhiteSpace(extension))
                    extension = ".jpg"; // fallback

            }

            switch (fileType)
            {
                case MetadataFileType.AlbumImage:
                case MetadataFileType.SongImage:
                    await mediaAttachmentService.UploadImage(albumId, songId, extension, stream);
                    break;
                //case MetadataFileType.Song:
                //    await mediaAttachmentService.DeleteSongAsync(albumId, songId!);
                //    break;
                case MetadataFileType.SongLyrics:
                    if (songId == null)
                        throw new ArgumentNullException(nameof(songId), "You must provide a songId when uploading a Song Lyrics");
                    await mediaAttachmentService.UploadLyrics(albumId, songId, stream);
                    break;
                //case MetadataFileType.SongVideo:
                //    await mediaAttachmentService.DeleteVideoAsync(albumId, songId!);
                //    break;
                default:
                    break;
            }
            return Ok();
        }

        //[HttpGet("{albumId}/file/{fileType}")]
        //public async Task<IActionResult> Get(string albumId, MetadataFileType fileType, [FromQuery] string? songId = null)
        //{
        //    var result = await albumService.GetMetadataFileAsync(fileType, albumId, songId);
        //    return Ok(result);
        //}

        [HttpGet("lookup/{artist}/{album}")]
        public async Task<IActionResult> LookupAlbum(string artist, string album)
        {
            var release = await metadataService.GetMetadataForAlbumAsync(artist, album);
            if (release == null)
                return NotFound(new { message = "No release found" });

            return Ok(release);
        }

        private static async Task<Stream> DownloadFileAsync(string url)
        {
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync(url!);
            if (!response.IsSuccessStatusCode)
                throw new Exception($"Call to {url} returned status code {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");

            return await response.Content.ReadAsStreamAsync();
        }
    }
}
