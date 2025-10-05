'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';
import { useConfig } from './providers/ConfigProvider';

type Match = {
  artist: string;
  title: string;
  album: string;
  confidence: number;
  length: number;
};
export default function Home() {
  const config = useConfig();
  const CHUNK_INTERVAL = 500; // ms
  const REQUEST_INTERVAL = 2000; // ms

  // Estado para añadir canción
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estado para detección
  const [listening, setListening] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);

  // Grabación
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [position, setPosition] = useState<number>(0); // segundos actuales
  const [duration, setDuration] = useState<number>(0); // duración total en segundos
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const startProgressUpdater = (startPos: number, trackDuration: number) => {
    setPosition(startPos);
    setDuration(trackDuration);

    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = setInterval(() => {
      setPosition(p => {
        if (p < trackDuration) return p + 1;
        clearInterval(progressInterval.current!);
        return trackDuration;
      });
    }, 1000);
  };

  // --- Añadir canción ---
  const handleUpload = async () => {
    if (!file) return alert('Selecciona un archivo');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('album', album);

    const res = await fetch(`${config.apiUrl}/api/fingerprint/store`, {
      method: 'POST',
      body: formData,
    });
    setUploading(false);
    if (res.ok) alert('Canción añadida');
    else alert('Error al subir');
  };

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
    mediaRecorder.current.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.current.start(CHUNK_INTERVAL);

    // Cada 2s enviamos lo acumulado
    intervalRef.current = setInterval(sendChunk, REQUEST_INTERVAL);
    setListening(true);
  };

  const stopListening = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    setListening(false);
  };

  const sendChunk = async () => {
    const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    const res = await fetch(
      `${config.apiUrl}/api/audio/detect?duration=${
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
        const track = data.nowPlaying;

        // round up as I'm getting better results, as usually I get 1s less than the original playing time
        setMatch({
          artist: track.artist,
          album: data.album.title,
          confidence: data.confidence,
          length: track.duration,
          title: track.name,
        });

        // Set progress if first time, or if there's a significant difference
        if (duration === 0 || Math.abs(data.trackPosition - position) > 1)
          startProgressUpdater(data.trackPosition, track.duration);

        if (data.confidence > 0.7) {
          stopListening();
        }
      }
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>VisualAudio</h1>

      {/* Subir canción */}
      <section className={styles.section}>
        <h2>Añadir Canción</h2>
        <div className={styles.formGroup}>
          <input
            className={styles.input}
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Artista"
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Álbum"
            value={album}
            onChange={e => setAlbum(e.target.value)}
          />
          <input
            type="file"
            accept="audio/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={styles.button}
          >
            {uploading ? 'Subiendo...' : 'Guardar'}
          </button>
        </div>
      </section>

      {/* Detección */}
      <section className={styles.section}>
        <h2>Escuchar</h2>
        <button
          onClick={toggleListening}
          className={`${styles.button} ${
            listening ? styles.stop : styles.start
          }`}
        >
          {listening ? 'Detener' : 'Escuchar'}
        </button>
      </section>

      {/* Resultado */}
      {match && (
        <section className={`${styles.section} ${styles.result}`}>
          <h2>Canción detectada</h2>
          <p>
            <strong>{match.title}</strong> - {match.artist}
          </p>
          <p>
            <em>{match.album}</em>
          </p>
          <p>
            Confidence <em>{match.confidence * 100} %</em>
          </p>
          <div>
            <input
              type="range"
              min={0}
              max={duration}
              value={position}
              onChange={() => {}}
              style={{ width: '100%' }}
            />
            <p>
              {Math.floor(position / 60)}:
              {(position % 60).toString().padStart(2, '0')} /{' '}
              {Math.floor(duration / 60)}:
              {(duration % 60).toString().padStart(2, '0')}
            </p>
          </div>
          {/* Aquí más adelante añadiremos portada, letra, etc. */}
        </section>
      )}
    </main>
  );
}
