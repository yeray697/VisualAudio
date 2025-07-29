namespace VisualAudio.Data.FileStorage
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(Stream fileStream, string relativePath);
        Task<string> SaveFileAsync<T>(T content, string relativePath);
        Task<Stream> ReadFileAsync(string relativePath);
        Task<T?> ReadFileAsync<T>(string relativePath);
        Task DeleteFileAsync(string relativePath);
        Task DeleteDirectoryAsync(string relativePath);
        bool FileExists(string relativePath);
        string GetPath(string path);
    }
}
