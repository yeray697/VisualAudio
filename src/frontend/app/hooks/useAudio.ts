'use client';

import { NowPlaying } from '../../types/message';
import { useApi } from './useApi';

export function useUploadFingerprint() {
  return useApi<void>({
    endpoint: '/api/audio/storeFingerprint',
    method: 'POST',
    body: null,
    autoFetch: false,
  });
}

export function useSendAudioChunk() {
  return useApi({
    endpoint: `/api/audio/detect`,
    method: 'POST',
    body: null,
    autoFetch: false,
  });
}

export function useGetNowPlaying(autoFetch = true) {
  return useApi<NowPlaying>({
    endpoint: '/api/audio/nowPlaying',
    autoFetch,
  });
}
