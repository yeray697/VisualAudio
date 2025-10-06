import { FileLike } from '../types/album-form';

export function getAlbumFileUrl(
  baseUrl: string,
  fileName: FileLike | undefined
): string | null {
  if (!fileName || fileName instanceof File) return null;
  return `${baseUrl}/${fileName}`;
}

export function getSongImageWithFallback(
  baseUrl: string,
  fileName: FileLike | undefined,
  fallbackImage: FileLike | undefined
): string | null {
  return fileName
    ? getAlbumFileUrl(baseUrl, fileName)
    : fallbackImage
    ? getAlbumFileUrl(baseUrl, fallbackImage)
    : null;
}

export function isValidUrl(str: string | null): boolean {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
