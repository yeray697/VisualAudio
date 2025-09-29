import { useCallback, useEffect, useRef } from 'react';
import { PlayerElement } from './PlayerElement';
import { useConfig } from '../../providers/ConfigProvider';
import { Typography } from '@mui/material';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';

type Props = {
  listening: boolean;
  stopListening: () => void;
};
export const ListenControl = ({ listening, stopListening }: Props) => {
  console.log('Render <ListenControl>');

  const { setNowPlaying } = useNowPlayingStore();

  const CHUNK_INTERVAL = 500; // ms
  const REQUEST_INTERVAL = 2000; // ms
  const MAX_CHUNKS = 6000 / CHUNK_INTERVAL; // 6s / chunk interval

  const config = useConfig();
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const trackFound = useCallback(() => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopListening();
  }, [stopListening]);

  const sendChunk = useCallback(async () => {
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    const res = await fetch(
      `${config.apiUrl}/api/fingerprint/detect?duration=${
        audioChunks.current.length * CHUNK_INTERVAL
      }`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data) {
        setNowPlaying({
          ...data,
          updatedAt: new Date(),
        });

        if (data.confidence > 0.7) {
          trackFound();
        }
      }
    }
  }, [config.apiUrl, trackFound, setNowPlaying]);

  const startListening = useCallback(async () => {
    audioChunks.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.current.push(e.data);

      if (audioChunks.current.length > MAX_CHUNKS) {
        audioChunks.current.shift();
      }
    };
    mediaRecorder.current.start(CHUNK_INTERVAL);

    intervalRef.current = setInterval(sendChunk, REQUEST_INTERVAL);
  }, [sendChunk]);

  useEffect(() => {
    if (listening) {
      startListening();
    }
  }, [listening, startListening]);

  return (
    <>
      {listening && (
        <PlayerElement
          sx={{
            zIndex: 5,
            height: 'auto',
            alignItems: 'center',
            paddingX: 4,
            paddingY: 2,
          }}
        >
          <Typography fontSize="1.25rem">Listening...</Typography>
        </PlayerElement>
      )}
    </>
  );
};
