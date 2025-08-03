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


# Runtime stage
FROM debian:bookworm-slim AS runtime

# install net9 dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libc6 \
    libgcc-s1 \
    libgssapi-krb5-2 \
    libicu70 \
    libssl3 \
    libstdc++6 \
    libunwind8 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# instala net9
RUN curl -SL --output dotnet-runtime-9.0.deb https://aka.ms/dotnet/thank-you/runtime-9.0-linux-x64-bundle-installer \
    && dpkg -i dotnet-runtime-9.0.deb \
    && rm dotnet-runtime-9.0.deb

# make ffmpeg 7 from repo
RUN apt-get update && apt-get install -y \
    build-essential yasm pkg-config libx264-dev libx265-dev libvpx-dev libfdk-aac-dev libopus-dev libmp3lame-dev \
    && git clone --depth 1 https://github.com/FFmpeg/FFmpeg.git /ffmpeg \
    && cd /ffmpeg && ./configure --prefix=/usr/local --enable-gpl --enable-libx264 --enable-libx265 --enable-libvpx --enable-libfdk-aac --enable-libmp3lame --enable-libopus \
    && make -j$(nproc) && make install && rm -rf /ffmpeg
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "VisualAudio.Api.dll"]
