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
FROM ubuntu:24.04 AS runtime

# install net9
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

    RUN wget --no-check-certificate https://dot.net/v1/dotnet-install.sh -O /tmp/dotnet-install.sh && \
    chmod +x /tmp/dotnet-install.sh && \
    /tmp/dotnet-install.sh --channel 9.0 --runtime aspnetcore --install-dir /usr/share/dotnet && \
    ln -s /usr/share/dotnet/dotnet /usr/bin/dotnet && \
    rm /tmp/dotnet-install.sh


# dependencies to make ffmpeg 7
RUN apt-get update && apt-get install -y \
    autoconf automake build-essential cmake git libtool pkg-config yasm \
    libx264-dev libx265-dev libvpx-dev libfdk-aac-dev libopus-dev libmp3lame-dev \
    && rm -rf /var/lib/apt/lists/*

# make ffmpeg 7
RUN git clone --depth 1 --branch n7.1.1 https://git.ffmpeg.org/ffmpeg.git /ffmpeg && \
    cd /ffmpeg && ./configure --enable-gpl --enable-nonfree --enable-libx264 --enable-libx265 --enable-libvpx --enable-libfdk-aac --enable-libopus --enable-libmp3lame && \
    make -j$(nproc) && make install && \
    rm -rf /ffmpeg

WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "VisualAudio.Api.dll"]
