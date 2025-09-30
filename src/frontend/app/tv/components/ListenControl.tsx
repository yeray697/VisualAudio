import { useCallback, useEffect, useRef, useState } from 'react';
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
  const config = useConfig();

  const CHUNK_INTERVAL = 2000;
  const REQUEST_INTERVAL = 2000;
  const MAX_SECONDS = 6;
  const MAX_CHUNKS = MAX_SECONDS / (CHUNK_INTERVAL / 1000); // 6s / 2s = 3 chunks

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioBuffers = useRef<ArrayBuffer[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [debugStatus, setDebugStatus] = useState<string>('Idle');

  const trackFound = useCallback(() => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopListening();
    setDebugStatus('Track found! Stopped recording');
  }, [stopListening]);

  const sendChunk = useCallback(async () => {
    if (audioBuffers.current.length === 0) {
      setDebugStatus('No audio chunks yet...');
      return;
    }

    setDebugStatus(`Sending chunk #${audioBuffers.current.length}...`);

    const blob = new Blob(audioBuffers.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    try {
      const res = await fetch(
        `${config.apiUrl}/api/fingerprint/detect?duration=${
          MAX_SECONDS * 1000
        }`,
        { method: 'POST', body: formData }
      );

      if (res.ok) {
        const data = await res.json();
        if (data) {
          setNowPlaying({ ...data, updatedAt: new Date() });
          if (data.confidence > 0.7) trackFound();
        }
      } else {
        setDebugStatus(`Server responded with ${res.status}`);
      }
    } catch (err) {
      setDebugStatus(`Error sending chunk: ${err}`);
    }
  }, [config.apiUrl, setNowPlaying, trackFound]);

  const startListening = useCallback(async () => {
    audioBuffers.current = [];
    setDebugStatus('Requesting microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = async e => {
        if (e.data.size > 0) {
          const buf = await e.data.arrayBuffer();
          audioBuffers.current.push(buf);
          if (audioBuffers.current.length > MAX_CHUNKS)
            audioBuffers.current.shift();
          setDebugStatus(`Recorded ${audioBuffers.current.length} chunk(s)`);
        }
      };

      mediaRecorder.current.start(CHUNK_INTERVAL);
      intervalRef.current = setInterval(sendChunk, REQUEST_INTERVAL);
      setDebugStatus('Listening...');
    } catch (err) {
      setDebugStatus(`Microphone access denied: ${err}`);
    }
  }, [sendChunk]);

  useEffect(() => {
    if (listening) startListening();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      mediaRecorder.current?.stop();
      mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
      setDebugStatus('Stopped');
    };
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
          <Typography fontSize="1.25rem">Listening... {debugStatus}</Typography>
        </PlayerElement>
      )}
    </>
  );
};
