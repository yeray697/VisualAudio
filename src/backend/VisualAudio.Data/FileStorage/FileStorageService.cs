using System.Text.Json;

using Microsoft.Extensions.Options;

namespace VisualAudio.Data.FileStorage
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;

        public FileStorageService(IOptions<FileStorageOptions> options)
        {
            _basePath = options.Value.BasePath;
            Directory.CreateDirectory(_basePath);
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string relativePath)
        {
            var fullPath = GetPath(relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            using var file = File.Create(fullPath);
            await fileStream.CopyToAsync(file);
            return relativePath;
        }

        public async Task<string> SaveFileAsync<T>(T content, string relativePath)
        {
            if (typeof(T) is Stream || typeof(Stream).IsAssignableFrom(typeof(T)))
                return await SaveFileAsync((Stream)(object)content, relativePath);
            var fullPath = GetPath(relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            await File.WriteAllTextAsync(fullPath, JsonSerializer.Serialize(content));

            return relativePath;
        }

        public async Task<Stream> ReadFileAsync(string relativePath)
        {
            var fullPath = GetPath(relativePath);
            return File.OpenRead(fullPath);
        }

        public async Task<T?> ReadFileAsync<T>(string relativePath)
        {
            var fullPath = GetPath(relativePath);
            if (typeof(T) is Stream || typeof(Stream).IsAssignableFrom(typeof(T)))
                return (T)(object)await ReadFileAsync(fullPath);

            if (!File.Exists(fullPath))
                return default;
            var json = await File.ReadAllTextAsync(fullPath);
            return JsonSerializer.Deserialize<T>(json);
        }

        public Task DeleteFileAsync(string relativePath)
        {
            var fullPath = GetPath(relativePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
            return Task.CompletedTask;
        }

        public Task DeleteDirectoryAsync(string relativePath)
        {
            var fullPath = GetPath(relativePath);
            if (Directory.Exists(fullPath))
                Directory.Delete(fullPath, true);
            return Task.CompletedTask;
        }

        public bool FileExists(string relativePath)
        {
            return File.Exists(GetPath(relativePath));
        }

        public string GetPath(string path)
            => Path.Combine(_basePath, path);
    }
}
