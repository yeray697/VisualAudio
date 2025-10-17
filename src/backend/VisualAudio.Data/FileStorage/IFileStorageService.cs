namespace VisualAudio.Data.FileStorage
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(Stream fileStream, string relativePath, bool isTmpFile = false);
        Task<string> SaveFileAsync<T>(T content, string relativePath, bool isTmpFile = false);
        Stream ReadFile(string relativePath, bool isTmpFile = false);
        Task<T?> ReadFileAsync<T>(string relativePath, bool isTmpFile = false);
        Task DeleteFileAsync(string relativePath, bool isTmpFile = false);
        Task DeleteDirectoryAsync(string relativePath, bool isTmpFile = false);
        bool FileExists(string relativePath, bool isTmpFile = false);
        string GetPath(string path, bool isTmpFile = false);
        string ParseStoragePath(string path, bool isTmpFile = false);
    }
}
