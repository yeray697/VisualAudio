'use client';

import { Album, Video } from '../../types/album';
import { useApi } from './useApi';

export type VideoJobPayload = Omit<Video, 'filename' | 'jobId'> & {
  albumId: string;
  songId: string;
};

export type FingerprintJobPayload = {
  albumId: string;
  songId: string;
  fileContent: File;
};

export function usePostVideoJob(autoFetch = false) {
  const api = useApi<Album>({
    endpoint: '/api/jobs/video',
    method: 'POST',
    body: {},
    autoFetch,
  });

  const fetch = async (requests: VideoJobPayload[]) => {
    for (const rq of requests) {
      await api.fetch({
        body: rq,
      });
    }
  };

  return { ...api, fetch };
}

export function usePostFingerprintJob(autoFetch = false) {
  const api = useApi<Album>({
    endpoint: '/api/jobs/fingerprint',
    method: 'POST',
    body: {},
    autoFetch,
  });

  const fetch = async (requests: FingerprintJobPayload[]) => {
    for (const rq of requests) {
      const formData = new FormData();
      formData.append('AlbumId', rq.albumId);
      formData.append('SongId', rq.songId);
      formData.append('FileContent', rq.fileContent);
      await api.fetch({
        body: formData,
      });
    }
  };

  return { ...api, fetch };
}
