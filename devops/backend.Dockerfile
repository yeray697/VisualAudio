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

RUN dotnet publish VisualAudio.Api/VisualAudio.Api.csproj \
    -c Release \
    -o /app/publish \
    --self-contained \
    -p:PublishSingleFile=true

# Runtime 
FROM ubuntu:rolling AS runtime
WORKDIR /app

RUN apt update && \
    apt install --no-install-recommends -y \
        ffmpeg \
        libicu76 \
        tzdata \
        ca-certificates \
        curl \
        python3 \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /app/yt-dlp \
    && chmod +x /app/yt-dlp

# Entrypoint
ENTRYPOINT ["/app/VisualAudio.Api"]
