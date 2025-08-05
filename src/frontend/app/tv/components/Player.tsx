"use client";
import styled from '@emotion/styled';
import { Lrc } from 'react-lrc';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { useGetAlbumFile } from '../../hooks/useAlbumMutations';
import { Box, Grid } from '@mui/material';
import { LyricsLrc } from './LyricsLrc';
import { useEffect, useState } from 'react';
import { formatDurationToTimeString } from '../../../utils/timeUtils';

export const Player = () => {
  const { nowPlaying } = useNowPlayingStore();
  const getCurrentPosition = useNowPlayingStore((s) => s.getCurrentPosition);
  const [_, setTick] = useState(0);
  useEffect(() => {
    if (!nowPlaying)
      return;
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [nowPlaying]);
  

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
    <Grid container>
      <Grid size={{xs:9}} height="90vh">
        <LyricsLrc lyrics={lyrics} position={currentPosition} />
      </Grid>
      <Grid size={{xs:3}}>
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
      </Grid>
    </Grid>
  );
};