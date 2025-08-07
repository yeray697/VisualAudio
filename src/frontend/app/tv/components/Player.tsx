"use client";

import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { useGetAlbumFile } from '../../hooks/useAlbumMutations';
import { Box } from '@mui/material';
import { LyricsLrc } from './LyricsLrc';
import { useEffect, useState } from 'react';
import { useConfig } from '../../providers/ConfigProvider';
import { getAlbumFileUrl } from '../../../utils/albumFileUtils';
import { PlayerElement } from './PlayerElement';
import { CurrentPlaying } from './CurrentPlaying';
import { VideoPlayer } from './VideoPlayer';
import { Queue } from './Queue';

export const Player = () => {
  const config = useConfig();
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

  useEffect(() => {
    if (lyricsBlob) {
      lyricsBlob.text().then((txt) => {
        setLyrics(txt);
      });
    }
  }, [lyricsBlob]);

  const nowPlayingImageUrl = (nowPlaying && getAlbumFileUrl(
    config.apiUrl,
    nowPlaying.nowPlaying.songImageFilename ?? nowPlaying.album.albumImageFilename,
    nowPlaying.album.id,
    nowPlaying.nowPlaying.songImageFilename ? nowPlaying.nowPlaying.id : undefined 
  )) ?? undefined;
  
  const hasLyrics = !!lyrics;
  const hasVideo = true;

  // Calcualte side panel sizes
  let nowPlayingHeight = '100%';
  let lyricsHeight = '0%';
  let queueHeight = '0%';
  if (!hasLyrics && !hasVideo) {
    nowPlayingHeight = '0%';
    queueHeight = '100%';
  } else if (hasLyrics && !hasVideo) {
    nowPlayingHeight = '35%';
    queueHeight = '65%';
  } else if (hasLyrics && hasVideo) {
    nowPlayingHeight = '25%';
    lyricsHeight = '50%';
    queueHeight = '25%';
  } else if (!hasLyrics && hasVideo) {
    nowPlayingHeight = '25%';
    lyricsHeight = '0%';
    queueHeight = '60%';
  }
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        width: "100vw",
        height: "100vh",
        padding: 5,
        boxSizing: "border-box",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        "::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${nowPlayingImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(40px) brightness(0.4) saturate(1.5)",
          transform: "scale(1.2)",
          animation: "backgroundPan 20s ease-in-out infinite",
          zIndex: -1,
        },
      }}
    >
      {/* main content */}
      <Box
        flex={1}
        height='100%'
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        {hasVideo ? (
          <VideoPlayer />
        ) : hasLyrics ? (
          <LyricsLrc lyrics={lyrics} position={currentPosition} />           
        ) : (
          <PlayerElement>
            <CurrentPlaying />
          </PlayerElement>
        )}
      </Box>

      {/* contextual panel */}
      <Box
        sx={{
          width: hasVideo ? '30%' : hasLyrics ? '20%' : '25%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          height: '100%',
          gap: 5,
          paddingLeft: 5
        }}
      >
        {hasLyrics && hasVideo && lyricsHeight !== '0%' && (
          <PlayerElement sx={{ height: lyricsHeight, paddingTop: 0, paddingBottom: 0 }}>
            <LyricsLrc lyrics={lyrics} position={currentPosition} />
          </PlayerElement>
        )}

        {nowPlayingHeight !== '0%' &&
          <PlayerElement sx={{ height: nowPlayingHeight }}>
            <CurrentPlaying />
          </PlayerElement>
        }

        {queueHeight !== '0%' && nowPlaying && (
          <PlayerElement sx={{ height: queueHeight }}>
            <Queue
              albumId={nowPlaying.album.id}
              fallbackImage={nowPlaying.album.albumImageFilename}
              songs={nowPlaying?.album.songs}
              position={nowPlaying?.nowPlaying.position}
            />
          </PlayerElement>
        )}
      </Box>
    
    </Box>

  );
};