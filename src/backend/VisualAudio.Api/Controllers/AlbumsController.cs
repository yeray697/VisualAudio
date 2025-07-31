// VisualAudio.Api/Controllers/AlbumsController.cs
using Microsoft.AspNetCore.Mvc;

using VisualAudio.Services.Albums;
using VisualAudio.Services.Albums.Models;
using VisualAudio.Services.Metadata;

namespace VisualAudio.Api.Controllers
{
    [ApiController]
    [Route("api/albums")]
    public class AlbumsController(IAlbumsService albumService, IMetadataService metadataService) : ControllerBase
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
            await albumService.DeleteMetadataFileAsync(fileType, albumId, songId);
            return NoContent();
        }

        [HttpPut("{albumId}/file/{fileType}")]
        public async Task<IActionResult> Update([FromForm] IFormFile? file, string albumId, MetadataFileType fileType, [FromQuery] string? songId = null, [FromQuery] string? url = null)
        {
            if (file == null && string.IsNullOrWhiteSpace(url))
            {
                return BadRequest("Debe proporcionar un archivo o una URL.");
            }
            Stream stream;
            string extension;
            if (file != null)
            {
                stream = file.OpenReadStream();
                extension = Path.GetExtension(file.FileName);
            }
            else
            {
                stream = await DownloadFileAsync(url);

                extension = Path.GetExtension(new Uri(url!).AbsolutePath);
                if (string.IsNullOrWhiteSpace(extension))
                    extension = ".jpg"; // fallback

            }
            await albumService.UpsertMetadataFileAsync(fileType, extension, stream, albumId, songId);
            return Ok();
        }

        [HttpGet("{albumId}/file/{fileType}")]
        public async Task<IActionResult> Get(string albumId, MetadataFileType fileType, [FromQuery] string? songId = null)
        {
            var result = await albumService.GetMetadataFileAsync(fileType, albumId, songId);
            return Ok(result);
        }

        [HttpGet("lookup/{artist}/{album}")]
        public async Task<IActionResult> LookupAlbum(string artist, string album)
        {
            var release = await metadataService.GetMetadataForAlbumAsync(artist, album);
            if (release == null)
                return NotFound(new { message = "No release found" });

            return Ok(release);
        }

        private async Task<Stream?> DownloadFileAsync(string url)
        {
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync(url!);
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadAsStreamAsync();
        }
    }
}
