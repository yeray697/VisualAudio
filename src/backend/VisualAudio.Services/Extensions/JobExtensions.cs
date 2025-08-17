using System.Text.Json;

using VisualAudio.Services.Jobs;

namespace VisualAudio.Services.Extensions
{
    public static class JobExtensions
    {
        public static void SetPayload<T>(this Job job, T payload)
        {
            job.Type = typeof(T).AssemblyQualifiedName!;
            job.PayloadJson = JsonSerializer.Serialize(payload);
        }

        public static Type? GetPayloadType(this Job job)
        {
            return Type.GetType(job.Type);
        }
    }
}
