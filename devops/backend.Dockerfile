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
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Instalar ffmpeg
RUN apt-get update && apt-get install -y wget gnupg && \
    echo "deb http://www.deb-multimedia.org bookworm main non-free" > /etc/apt/sources.list.d/deb-multimedia.list && \
    apt-get update && \
    apt-get install -y --allow-unauthenticated deb-multimedia-keyring && \
    apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VisualAudio.Api.dll"]
