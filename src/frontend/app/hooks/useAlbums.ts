'use client';

import { Album } from '../../types/album';
import { AlbumMetadata } from '../../types/album-metadata';
import { useApi } from './useApi';

export function useAlbums(autoFetch: boolean = true) {
  return useApi<Album[]>({
    endpoint: '/api/albums',
    autoFetch: autoFetch,
  });
}

export function useAlbum(id: string | undefined) {
  return useApi<Album>({
    endpoint: `/api/albums/${id}`,
    autoFetch: !!id,
  });
}

export function useSearchMetadata(artist: string, title: string) {
  return useApi<AlbumMetadata>({
    endpoint: `/api/albums/lookup/${encodeURIComponent(
      artist
    )}/${encodeURIComponent(title)}`,
    autoFetch: false,
  });
}
