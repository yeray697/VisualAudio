# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY src/backend/VisualAudio.sln ./
COPY src/backend/VisualAudio.Api/VisualAudio.Api.csproj VisualAudio.Api/
COPY src/backend/VisualAudio.Contracts/VisualAudio.Contracts.csproj VisualAudio.Contracts/
COPY src/backend/VisualAudio.Data/VisualAudio.Data.csproj VisualAudio.Data/
COPY src/backend/VisualAudio.Services/VisualAudio.Services.csproj VisualAudio.Services/

RUN dotnet restore VisualAudio.sln

COPY src/backend/. .

RUN dotnet publish VisualAudio.Api/VisualAudio.Api.csproj -c Release -o /app/publish


FROM linuxserver/ffmpeg:7.1.1 AS ffmpeg


# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0-bookworm-slim AS runtime
WORKDIR /app

COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/bin/ffmpeg
COPY --from=ffmpeg /usr/local/bin/ffprobe /usr/bin/ffprobe

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "VisualAudio.Api.dll"]