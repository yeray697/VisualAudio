using System.Text.Json;

using Microsoft.Extensions.Options;

namespace VisualAudio.Data.FileStorage
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly string _tmpPath;

        private static JsonSerializerOptions jsonSerializerOptions = new()
        {
            WriteIndented = true
        };

        public FileStorageService(IOptions<FileStorageOptions> options)
        {
            _basePath = options.Value.BasePath;
            _tmpPath = options.Value.TmpPath;
            Directory.CreateDirectory(_basePath);
            Directory.CreateDirectory(_tmpPath);
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string relativePath, bool isTmpFile = false)
        {
            var fullPath = GetPath(relativePath, isTmpFile);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            using var file = File.Create(fullPath);
            await fileStream.CopyToAsync(file);
            return relativePath;
        }

        public async Task<string> SaveFileAsync<T>(T content, string relativePath, bool isTmpFile = false)
        {
            if (content is Stream stream)
                return await SaveFileAsync(stream, relativePath, isTmpFile);
            var fullPath = GetPath(relativePath, isTmpFile);
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            await File.WriteAllTextAsync(fullPath, JsonSerializer.Serialize(content, jsonSerializerOptions));

            return relativePath;
        }

        public Stream ReadFile(string relativePath, bool isTmpFile = false)
        {
            var fullPath = GetPath(relativePath, isTmpFile);
            return File.OpenRead(fullPath);
        }

        public async Task<T?> ReadFileAsync<T>(string relativePath, bool isTmpFile = false)
        {
            var fullPath = GetPath(relativePath, isTmpFile);
            if (typeof(Stream).IsAssignableFrom(typeof(T)))
                return (T)(object) ReadFile(fullPath);

            if (!File.Exists(fullPath))
                return default;
            var json = await File.ReadAllTextAsync(fullPath);
            return JsonSerializer.Deserialize<T>(json);
        }

        public Task DeleteFileAsync(string relativePath, bool isTmpFile = false)
        {
            var fullPath = GetPath(relativePath, isTmpFile);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
            return Task.CompletedTask;
        }

        public Task DeleteDirectoryAsync(string relativePath, bool isTmpFile = false)
        {
            var fullPath = GetPath(relativePath, isTmpFile);
            if (Directory.Exists(fullPath))
                Directory.Delete(fullPath, true);
            return Task.CompletedTask;
        }

        public bool FileExists(string relativePath, bool isTmpFile = false)
        {
            return File.Exists(GetPath(relativePath));
        }

        public string GetPath(string path, bool isTmpFile = false)
            => isTmpFile ?
            Path.Combine(_tmpPath, path)
            : Path.Combine(_basePath, path);

        public string ParseStoragePath(string path, bool isTmpFile = false)
            => path.Replace(isTmpFile ? _tmpPath : _basePath, "");
    }
}
