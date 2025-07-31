export function getAlbumFileUrl(baseUrl: string, fileName: string | undefined, albumId: string, songId: string | undefined = undefined): string | null {
  if (!fileName)
    return null;
  let url = `${baseUrl}/albums/${albumId}`;
  if (songId)
    url += `/${songId}`
  return `${url}/${fileName}`;
}