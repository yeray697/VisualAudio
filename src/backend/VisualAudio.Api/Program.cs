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

// Controladores
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Para servir archivos estáticos (wwwroot)
builder.Services.AddDirectoryBrowser();

var app = builder.Build();
ConfigureWebSocket();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "VisualAudio API";
        options.Theme = ScalarTheme.Default;
    });
}

// === Middleware ===
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthorization();
// Middleware para imágenes JPEG en /albums
app.UseWhen(
    context =>
        context.Request.Path.StartsWithSegments("/albums"),
    appBuilder =>
    {
        appBuilder.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers["Access-Control-Allow-Origin"] = "*";
                return Task.CompletedTask;
            });

            await next();
        });
    }
);
// app.Use(async (context, next) =>
// {
//     await next();

//     var path = context.Request.Path.Value;
//     if (path != null && path.Contains("/albums/") && path.EndsWith(".jpeg"))
//     {
//         context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
//     }
// });
app.UseStaticFiles(); // Servir wwwroot
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

    // Endpoint HTTP para publicar mensaje desde Pi o web
    _ = app.MapPost("/api/publish", async (HttpContext context) =>
    {
        await webSocketManager.BroadcastAsync(context.Request.Body);
        return Results.Ok();
    });

    // Endpoint HTTP para publicar mensaje desde Pi o web
    _ = app.MapGet("/api/nowPlaying", async (HttpContext context) =>
    {
        var nowPlaying = webSocketManager.GetNowPlaying();
        return Results.Ok(nowPlaying);
    });
}



public class WebSocketManager
{
    private readonly ConcurrentDictionary<string, WebSocket> _clients = new();
    private readonly ConcurrentDictionary<MessageType, Message> _lastMessage = new();

    private static JsonSerializerOptions options = new JsonSerializerOptions()
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

                // Aquí puedes procesar mensajes entrantes desde la tele, si quieres
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
            var message = JsonSerializer.Deserialize<Message>(messageAsText, options);
            UpdateLastMessage(message);
        }
        catch (System.Exception e)
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
        _lastMessage.TryGetValue(MessageType.NOW_PLAYING, out Message value);
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
