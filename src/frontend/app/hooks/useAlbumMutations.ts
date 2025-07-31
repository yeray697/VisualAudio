// hooks/useAlbumMutations.ts
'use client';

import { Album, MetadataFileType } from '../../types/album';
import { useApi } from './useApi';

export function useCreateOrUpdateAlbum(initialAlbum: Album, autoFetch = false) {
  return useApi<Album>({
    endpoint: `/api/albums${initialAlbum.id ? `/${initialAlbum.id}` : ''}`,
    method: initialAlbum.id ? 'PUT' : 'POST',
    body: {
      id: initialAlbum.id,
      title: initialAlbum.title,
      artist: initialAlbum.artist,
      songs: initialAlbum.songs.map(({ id, name, position, duration }) => ({
        id,
        name,
        position,
        duration,
      })),
    },
    autoFetch,
    mapFn: (res) => ({ ...initialAlbum, id: res.id } as Album),
  });
}

export type UploadFileEntry = { file: File | string; filetype: MetadataFileType; songId?: string };
export function useUploadAlbumFiles(autoFetch = false) {
  const api = useApi<void>({ endpoint: '', method: 'PUT', autoFetch });

  const fetch = async (
    albumId: string,
    files: Array<UploadFileEntry>
  ) => {
    for (const { file, filetype, songId } of files) {
      const queryParams = [];
      if (songId) queryParams.push(`songId=${encodeURIComponent(songId)}`);
      let body: FormData | null = null;
      if (file instanceof File) {
        body = new FormData();
        body.append('file', file);
      } else {
        queryParams.push(`url=${encodeURIComponent(file)}`);
      }
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      await api.fetch({
        endpoint: `/api/albums/${albumId}/file/${filetype}${queryString}`,
        method: 'PUT',
        body,
      });
    }
  };

  return { ...api, fetch };
}


export type DeleteFileEntry = { filetype: MetadataFileType; songId?: string };
export function useDeleteAlbumFiles(autoFetch = false) {
  const api = useApi<void>({ endpoint: '', method: 'DELETE', autoFetch });

  const fetch = async (
    albumId: string,
    files: Array<DeleteFileEntry>
  ) => {
    for (const { filetype, songId } of files) {
      const query = songId ? `?songId=${encodeURIComponent(songId)}` : '';
      await api.fetch({
        endpoint: `/api/albums/${albumId}/file/${filetype}${query}`,
        method: 'DELETE',
      });
    }
  };

  return { ...api, fetch };
}



export function useGetAlbumFile(albumId: string, filetype: MetadataFileType, songId?: string, autoFetch = true) {
  const query = songId ? `?songId=${encodeURIComponent(songId)}` : "";
  return useApi<Blob>({
    endpoint: `/api/albums/${albumId}/file/${filetype}${query}`,
    method: 'GET',
    autoFetch,
    mapFn: (res) => res as Blob,
  });
}
