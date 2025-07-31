"use client"

import { useState, useRef, useEffect } from 'react'
import { TextField } from '@mui/material';
import { Match, Message } from '../../types/message';
import { useConfig } from '../providers/ConfigProvider';
import { usePublishToWS } from '../hooks/useNowPlayingData';
import { useSendAudioChunk as useDetectFingerprint, useUploadFingerprint as useStoreFingerprint } from '../hooks/useFingerprint';
import { useAlbum } from '../hooks/useAlbums';

export default function PlaygroundPage() {


  const [albumId, setAlbumId] = useState<string | undefined>();
  const [songId, setSongId] = useState<string | undefined>();
  const {fetch: publishMessage } = usePublishToWS()
  const config = useConfig();
  const CHUNK_INTERVAL = 500; // ms
  const REQUEST_INTERVAL = 2000; // ms
  const [message, setMessage] = useState("");

  const { fetch: storeFingerprint } = useStoreFingerprint();
  const { data: fingerprintResult, fetch: detectFingerprint } = useDetectFingerprint()
  const { data: album } = useAlbum(albumId)

  const sendDetection = async (message: Message) => {
     publishMessage({
      body: message
     })
  }
  // Estado para detección
  const [listening, setListening] = useState(false);

  // Grabación
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  // --- Iniciar/parar escucha ---
  const toggleListening = async () => {
    if (listening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    audioChunks.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.current.start(CHUNK_INTERVAL);

    // Cada 2s enviamos lo acumulado
    intervalRef.current = setInterval(sendChunk, REQUEST_INTERVAL);
    setListening(true);
  };

  const stopListening = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    setListening(false);
  };

  useEffect(() => {
    if (!fingerprintResult)
      return;

    if (fingerprintResult.confidence > 0.7) {
      stopListening();
    }
  }, [fingerprintResult])

  const sendChunk = async () => {

    detectFingerprint()
    const blob = new Blob(audioChunks.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    await detectFingerprint({ body: formData });
    // const start = performance.now();
    // const res = await fetch(`${config.apiUrl}/api/fingerprint/detect?duration=${audioChunks.current.length * CHUNK_INTERVAL}`, {
    //   method: "POST",
    //   body: formData,
    // });
    // const latency = (performance.now() - start) / 1000; // en segundos

    // if (res.ok) {
    //   const data = await res.json();
    //   if (data && data.track) {
    //     const track = data.match.audio.track;

    //     const trackMatchStart = data.match.audio.coverage.trackMatchStartsAt;
    //     const queryMatchStart = data.match.audio.coverage.queryMatchStartsAt; 
    //     const recordedDuration = data.match.audio.coverage.queryLength;
    //     const albumId = track.metaFields["albumId"];
    //     const songId = track.metaFields["songId"];
    //     setAlbumId(albumId);
    //     setSongId(songId);

    //     const song = album.songs.find(s => s.id === songId);

    //     const match = {
    //       nowPlaying: song,
    //       times: {
    //         trackMatchStart,
    //         queryMatchStart,
    //         recordedDuration,
    //         latency
    //       },
    //       album,
    //       confidence: data.confidence
    //     } as Match;
      
    //     await sendDetection({type: "NOW_PLAYING", data: match});

    //     if (data.confidence > 0.7) {
    //       stopListening();
    //     }
    //   }
    // }
  };

  const sendMessage = async () => {

    await sendDetection({type: "NOW_PLAYING", data: JSON.parse(message)});
  }

  return (
    <main style={{padding: "2rem", maxWidth: "800px", margin: 0, fontFamily: "Arial, sans-serif"}}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom:"2rem"}}>VisualAudio</h1>

      {/* Detección */}
      <section style={{padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "2rem", background: "#333" }}>
        <h2>Escuchar</h2>
        <button
          onClick={toggleListening}
          // className={`${styles.button} ${listening ? styles.stop : styles.start}`}
        >
          {listening ? "Detener" : "Escuchar"}
        </button>

          <TextField
            label="Artist"
            fullWidth
            multiline
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        <button
          onClick={sendMessage}
          // className={`${styles.button} ${listening ? styles.stop : styles.start}`}
        >
          Send
        </button>
      </section>
    </main>
  );
}
