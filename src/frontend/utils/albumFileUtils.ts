import { API_BASE_URL } from "./envUtils";

export function getAlbumFileUrl(fileName: string | undefined, albumId: string, songId: string | undefined = undefined): string | null {
  if (!fileName)
    return null;
  let url = `${API_BASE_URL}/albums/${albumId}`;
  if (songId)
    url += `/${songId}`
  return `${url}/${fileName}`;
}