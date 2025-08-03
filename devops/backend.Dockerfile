# Build
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

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0-bookworm-slim AS runtime
WORKDIR /app

# jellyfin-ffmpeg7 dependencies
RUN apt-get update && \
    apt-get install -y wget \
    libxcb1 libbluray2 libelf1 libexpat1 libmp3lame0 libopenmpt0 libopus0 libpciaccess0 \
    libtheora0 libvorbis0a libvorbisenc2 libvpx7 libwebp7 libwebpmux3 libx11-xcb1 \
    libx264-164 libx265-199 libxcb-dri3-0 libxcb-present0 libxcb-randr0 libxcb-sync1 \
    libxshmfence1 libzvbi0 ocl-icd-libopencl1 && \
    rm -rf /var/lib/apt/lists/*

# jellyfin-ffmpeg7
RUN wget -O /tmp/jellyfin-ffmpeg7.deb \
    https://repo.jellyfin.org/files/ffmpeg/debian/latest-7.x/amd64/jellyfin-ffmpeg7_7.1.1-7-bookworm_amd64.deb && \
    apt-get update && \
    apt-get install -y /tmp/jellyfin-ffmpeg7.deb && \
    rm /tmp/jellyfin-ffmpeg7.deb && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "VisualAudio.Api.dll"]
