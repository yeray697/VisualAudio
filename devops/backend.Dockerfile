# Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# install toolchain for native aot
RUN apt-get update && \
    apt-get install -y --no-install-recommends clang zlib1g-dev libc6-dev && \
    rm -rf /var/lib/apt/lists/*

COPY src/backend/VisualAudio.sln ./
COPY src/backend/VisualAudio.Api/VisualAudio.Api.csproj VisualAudio.Api/
COPY src/backend/VisualAudio.Contracts/VisualAudio.Contracts.csproj VisualAudio.Contracts/
COPY src/backend/VisualAudio.Data/VisualAudio.Data.csproj VisualAudio.Data/
COPY src/backend/VisualAudio.Services/VisualAudio.Services.csproj VisualAudio.Services/

RUN dotnet restore VisualAudio.sln

COPY src/backend/. .

RUN dotnet publish VisualAudio.Api/VisualAudio.Api.csproj -c Release -o /app/publish \
    -p:PublishAot=true \
    -p:PublishTrimmed=true \
    -p:InvariantGlobalization=true

# Runtime
FROM ubuntu:24.04 AS runtime
WORKDIR /app

# install ffmpeg 7
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENTRYPOINT ["./VisualAudio.Api"]
