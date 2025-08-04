"use client";
import styled from '@emotion/styled';
import { Lrc } from 'react-lrc';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { useGetAlbumFile } from '../../hooks/useAlbumMutations';
import { Box } from '@mui/material';
import { LyricsLrc } from './LyricsLrc';
import { useEffect, useState } from 'react';
import { formatDurationToTimeString } from '../../../utils/timeUtils';

export const Player = () => {
  const { nowPlaying } = useNowPlayingStore();
  const getCurrentPosition = useNowPlayingStore((s) => s.getCurrentPosition);
  const [_, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, []);
  

  const { data: lyricsBlob } = useGetAlbumFile(nowPlaying?.album.id ?? "", "SongLyrics", nowPlaying?.nowPlaying.id, !!nowPlaying?.nowPlaying.id)

  const [lyrics, setLyrics] = useState("");

  const currentPosition = getCurrentPosition();
  const positionStr = nowPlaying ? formatDurationToTimeString(currentPosition) : "";
  const durationStr = nowPlaying ? formatDurationToTimeString(nowPlaying.nowPlaying.duration) : "";
  const positionDisplay = nowPlaying ? `${positionStr} / ${durationStr}` : "";

  useEffect(() => {
    if (lyricsBlob) {
      lyricsBlob.text().then((txt) => {
        setLyrics(txt);
      });
    }
  }, [lyricsBlob]);
  
  return (
    <Box>
      <Box height={150}>
        <LyricsLrc lyrics={lyrics} position={currentPosition} />
      </Box>
      <Box>
        {nowPlaying && (
        <section style={{padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "2rem", background: "#333" }}>
          <h2>Canción detectada</h2>
          <p>
            <strong>{nowPlaying.nowPlaying.name}</strong> - {nowPlaying.album.artist}
          </p>
          <p>
            <em>{nowPlaying.album.title}</em>
          </p>
          <p>
            Confidence <em>{nowPlaying.confidence * 100} %</em>
          </p>
          <div>
            <input
              type="range"
              min={0}
              value={currentPosition}
              max={nowPlaying.nowPlaying.duration}
              onChange={() => {}}
              style={{ width: "100%" }}
            />
            <p>{positionDisplay}</p>
          </div>
        </section>
      )}
      </Box>
    </Box>
  );
};