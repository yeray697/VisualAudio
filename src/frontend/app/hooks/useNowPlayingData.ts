'use client';

import { useApi } from './useApi';
import { Message, NowPlaying } from '../../types/message';

export function usePublishToWS(message?: Message, autoFetch = false) {
  return useApi<boolean>({
    endpoint: '/api/publish',
    method: 'POST',
    body: message,
    autoFetch,
    mapFn: () => true,
  });
}

export function useNowPlaying(autoFetch = true) {
  return useApi<NowPlaying>({
    endpoint: '/api/nowPlaying',
    autoFetch,
  });
}