import { FileLike } from "../types/album";

export function getAlbumFileUrl(baseUrl: string, fileName: FileLike | undefined, albumId: string, songId: string | undefined = undefined): string | null {
  if (!fileName || fileName instanceof File)
    return null;
  let url = `${baseUrl}/albums/${albumId}`;
  if (songId)
    url += `/${songId}`
  return `${url}/${fileName}`;
}

export function isValidUrl(str: string | null): boolean {
  if (!str)
    return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}