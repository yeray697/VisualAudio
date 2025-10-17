using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using Scalar.AspNetCore;

using VisualAudio.Data.FileStorage;
using VisualAudio.Services.Extensions;

var builder = WebApplication.CreateBuilder(args);


// === Configuración de CORS ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection("FileStorage"));

builder.Services.AddOpenApi();

// === Servicios propios ===
builder.Services.RegisterServices();

builder.Services.AddLogging();
builder.Services.RegisterJobService();

// Controladores
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDirectoryBrowser();

var app = builder.Build();
ConfigureWebSocket();

app.MapOpenApi();
// http://localhost:5112/scalar/
app.MapScalarApiReference(options =>
{
    options.Title = "VisualAudio API";
    options.Theme = ScalarTheme.Default;
});

// === Middleware ===
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    context.Response.Headers.Remove("X-Frame-Options");
    await next();
});

// Servir archivos estáticos con CORS para /albums
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.File.PhysicalPath;

        // Aplica CORS a toda la carpeta /albums
        if (path != null && path.Contains(Path.Combine("wwwroot", "albums")))
        {
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
        }
    }
});


app.MapControllers();

// Servir index.html por defecto si alguien entra a /
app.MapFallbackToFile("index.html");

app.Run();

void ConfigureWebSocket()
{
    _ = app.UseWebSockets();

    var webSocketManager = new WebSocketManager();

    _ = app.Map("/ws", async context =>
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            var webSocket = await context.WebSockets.AcceptWebSocketAsync();
            await webSocketManager.HandleClient(webSocket);
        }
        else
        {
            context.Response.StatusCode = 400;
        }
    });

    _ = app.MapPost("/api/publish", async (HttpContext context) =>
    {
        await webSocketManager.BroadcastAsync(context.Request.Body);
        return Results.Ok();
    });

    _ = app.MapGet("/api/nowPlaying", (HttpContext context) =>
    {
        var nowPlaying = webSocketManager.GetNowPlaying();
        return Results.Ok(nowPlaying);
    });
}

public class WebSocketManager
{
    private readonly ConcurrentDictionary<string, WebSocket> _clients = new();
    private readonly ConcurrentDictionary<MessageType, Message> _lastMessage = new();

    private readonly static JsonSerializerOptions options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public async Task HandleClient(WebSocket socket)
    {
        var id = Guid.NewGuid().ToString();
        _clients.TryAdd(id, socket);

        var buffer = new byte[4096];
        try
        {
            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;

                var clientMsg = Encoding.UTF8.GetString(buffer, 0, result.Count);
                Console.WriteLine($"Mensaje desde cliente: {clientMsg}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error en socket: {ex.Message}");
        }
        finally
        {
            _clients.TryRemove(id, out _);
            if (socket.State != WebSocketState.Closed)
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
        }
    }

    private void UpdateLastMessage(Message message)
    {
        message.MessageReceived = DateTime.UtcNow;
        _lastMessage.AddOrUpdate(message.Type, message, (_, _) => message);
    }

    public async Task BroadcastAsync(Stream stream)
    {
        var messageAsText = await new StreamReader(stream).ReadToEndAsync();
        try
        {
            var message = JsonSerializer.Deserialize<Message>(messageAsText, options)!;
            UpdateLastMessage(message);
        }
        catch
        {
            return;
        }

        var msgBuffer = Encoding.UTF8.GetBytes(messageAsText);
        var tasks = _clients.Values.Select(async socket =>
        {
            if (socket.State == WebSocketState.Open)
            {
                await socket.SendAsync(msgBuffer, WebSocketMessageType.Text, true, CancellationToken.None);
            }
        });

        await Task.WhenAll(tasks);
    }

    public Message? GetNowPlaying()
    {
        _lastMessage.TryGetValue(MessageType.NOW_PLAYING, out Message? value);
        return value;
    }

    public enum MessageType
    {
        NOW_PLAYING
    }

    public class Message
    {
        public DateTime MessageReceived { get; set; }
        public JsonElement Data { get; set; }
        public MessageType Type { get; set; }
    }
}
