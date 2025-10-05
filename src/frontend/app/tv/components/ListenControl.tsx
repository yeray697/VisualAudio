import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerElement } from './PlayerElement';
import { useConfig } from '../../providers/ConfigProvider';
import { Typography } from '@mui/material';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { NowPlaying } from '../../../types/message';

export const ListenControl = () => {
  const { setNowPlaying } = useNowPlayingStore();
  const isListening = useNowPlayingStore(state => state.shouldListenNext);
  const setShouldListenNext = useNowPlayingStore(
    state => state.setShouldListenNext
  );
  const config = useConfig();

  const START_INTERVAL = 2000;
  const RECORD_DURATION = 6000;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mantener todas las grabadoras activas y sus timeouts
  const activeRecorders = useRef<
    {
      recorder: MediaRecorder;
      stream: MediaStream;
      timeout: NodeJS.Timeout;
    }[]
  >([]);

  const [debugStatus, setDebugStatus] = useState<string>('Idle');

  const trackFound = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    cleanupRecorders();
    setShouldListenNext(false);
    setDebugStatus('Track found! Stopped listening.');
  }, [setShouldListenNext]);

  const sendRecording = useCallback(
    async (blob: Blob) => {
      console.log('Listener-Sending recording:', blob.size, 'bytes');
      setDebugStatus(`Sending ${Math.round(blob.size / 1024)} KB blob...`);

      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      try {
        const res = await fetch(`${config.apiUrl}/api/audio/detect`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const text = await res.text();
          if (!text) {
            setDebugStatus('No match (empty response), keep listening...');
            return;
          }

          let data: NowPlaying | undefined = undefined;
          try {
            data = JSON.parse(text);
          } catch {
            setDebugStatus('Invalid JSON response');
            return;
          }

          console.log('Listener-Response:', data);
          if (data) {
            setNowPlaying({ ...data, updatedAt: new Date() });
            if (data.confidence > 0.7) {
              trackFound();
            }
          }
        } else {
          setDebugStatus(`Server responded with ${res.status}`);
        }
      } catch (err) {
        console.error('Error sending recording:', err);
        setDebugStatus(`Error sending recording: ${err}`);
      }
    },
    [config.apiUrl, setNowPlaying, trackFound]
  );

  const startRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log(
          'Recorder finished, got blob of',
          blob.size,
          'bytes (~',
          RECORD_DURATION / 1000,
          's)'
        );
        stream.getTracks().forEach(t => t.stop());
        await sendRecording(blob);
      };

      recorder.start();
      setDebugStatus('Recording started...');

      const timeout = setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
          setDebugStatus('Recording stopped, processing...');
        }
      }, RECORD_DURATION);

      activeRecorders.current.push({ recorder, stream, timeout });
    } catch (err) {
      console.error('Error accessing mic:', err);
      setDebugStatus(`Microphone access denied: ${err}`);
    }
  }, [sendRecording]);

  const cleanupRecorders = useCallback(() => {
    activeRecorders.current.forEach(({ recorder, stream, timeout }) => {
      clearTimeout(timeout);
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {}
      }
      stream.getTracks().forEach(t => t.stop());
    });
    activeRecorders.current = [];
  }, []);

  useEffect(() => {
    if (isListening) {
      setDebugStatus('Starting interval...');
      startRecorder();
      intervalRef.current = setInterval(() => {
        console.log('Interval tick -> start new recorder');
        startRecorder();
      }, START_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cleanupRecorders();
      setDebugStatus('Stopped');
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      cleanupRecorders();
      setDebugStatus('Stopped');
    };
  }, [isListening, startRecorder, cleanupRecorders]);

  return (
    <>
      {isListening && (
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
