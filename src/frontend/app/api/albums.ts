import { Album, MetadataFileType } from "../../types/album";
import { Message } from "../../types/message";
import { API_BASE_URL } from "../../utils/envUtils"

export const BASE_URL = `${API_BASE_URL}/api/albums`;

export async function getAlbums(): Promise<Album[]> {
  const res = await fetch(BASE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch albums");
  return res.json();
}

export async function getAlbum(id: string): Promise<Album> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch album");
  return res.json();
}

export async function searchMetadata(artist: string, title: string): Promise<Album> {
  const res = await fetch(`${BASE_URL}/lookup/${artist}/${title}`);
  if (!res.ok) throw new Error("Failed to fetch album");
  return res.json();
}

export async function createOrUpdateAlbum(album: Album): Promise<Album> {
  const method = album.id ? "PUT" : "POST";
  const url = album.id ? `${BASE_URL}/${album.id}` : BASE_URL;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: album.id,
      title: album.title,
      artist: album.artist,
      songs: album.songs.map(({ id, name, position, duration }) => ({
        id,
        name,
        position,
        duration,
      })),
    }),
  });
  

  if (!res.ok) throw new Error("Failed to save album");
  const albumId = await res.text();
  album.id = albumId;
  return album;
}

export async function uploadAlbumFile(albumId: string, file: File | string, filetype: MetadataFileType, songId?: string): Promise<void> {
  const queryParams = [];
  if (songId) {
    queryParams.push(`songId=${encodeURIComponent(songId)}`);
  }

  let formData: FormData | null = null;
  if (file instanceof File) {
    formData = new FormData();
    formData.append("file", file);
  }
  else {
    queryParams.push(`url=${encodeURIComponent(file)}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  const url = `${BASE_URL}/${albumId}/file/${filetype}${queryString}`;

  const res = await fetch(url, { method: "PUT", body: formData });

  if (!res.ok) throw new Error("Failed to upload file");
}

export async function deleteAlbumFile(albumId: string, filetype: MetadataFileType, songId?: string): Promise<void> {
  const url = `${BASE_URL}/${albumId}/file/${filetype}${songId ? `?songId=${encodeURIComponent(songId)}` : ""}`;
  const res = await fetch(url, { method: "DELETE" });

  if (!res.ok) throw new Error("Failed to delete file");
}

export async function getAlbumFile(albumId: string, filetype: MetadataFileType, songId?: string): Promise<Blob> {
  const url = `${BASE_URL}/${albumId}/file/${filetype}${songId ? `?songId=${encodeURIComponent(songId)}` : ""}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) throw new Error("Failed to upload file");

  return res.blob();
}

export async function publishToWS(message: Message): Promise<boolean> {
  const url = `${API_BASE_URL}/api/publish`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  });

  if (!res.ok) throw new Error("Failed to upload file");
  
  return true;
}

export async function getNowPlaying(): Promise<Message> {
  const url = `${API_BASE_URL}/api/nowPlaying`;
  const res = await fetch(url, {
    method: "GET"
  });

  if (!res.ok) throw new Error("Failed to upload file");
  
  return res.json();
}
