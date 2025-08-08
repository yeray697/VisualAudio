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
import { AnimatePresence, motion } from 'framer-motion';
import { Blurhash } from "react-blurhash";
import { useBlurhashContext } from './BlurhashProvider';

const MotionBox = motion(Box);

export const Player = () => {
  const config = useConfig();
  const { nowPlaying } = useNowPlayingStore();
  const { setImageUrl } = useBlurhashContext();
  const { textColor, overlayColor, blurhash } = useBlurhashContext();
  const getCurrentPosition = useNowPlayingStore((s) => s.getCurrentPosition);

  const [_, setTick] = useState(0);
  useEffect(() => {
    if (!nowPlaying) return;
    const interval = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(interval);
  }, [nowPlaying]);

  const { data: lyricsBlob } = useGetAlbumFile(
    nowPlaying?.album.id ?? "",
    "SongLyrics",
    nowPlaying?.nowPlaying.id,
    !!nowPlaying?.nowPlaying.id
  );

  const [lyrics, setLyrics] = useState("");
  const currentPosition = getCurrentPosition();

  useEffect(() => {
    if (lyricsBlob) {
      lyricsBlob.text().then(setLyrics);
    }
  }, [lyricsBlob]);

  useEffect(() => {
    const nowPlayingImageUrl =
    (nowPlaying &&
      getAlbumFileUrl(
        config.apiUrl,
        nowPlaying.nowPlaying.songImageFilename ?? nowPlaying.album.albumImageFilename,
        nowPlaying.album.id,
        nowPlaying.nowPlaying.songImageFilename ? nowPlaying.nowPlaying.id : undefined
      )) ?? undefined;
    
    if (!nowPlayingImageUrl)
      return;
    setImageUrl(nowPlayingImageUrl)
  }, [nowPlaying, config.apiUrl, setImageUrl])
  
  const hasLyrics = !!lyrics;
  const hasVideo = (nowPlaying?.nowPlaying.position ?? 2) % 2; // TODO: toggle this

  // Calcualte side panel sizes
  const layoutHeights = {
    nowPlaying: '0%',
    lyrics: '0%',
    queue: '100%',
  };

  if (hasLyrics && !hasVideo) {
    layoutHeights.nowPlaying = '24%';
    layoutHeights.queue = '75%';
  } else if (hasLyrics && hasVideo) {
    layoutHeights.nowPlaying = '25%';
    layoutHeights.lyrics = '49%'; // not sure why, but I need this so queue items do not overflow
    layoutHeights.queue = '25%';
  } else if (!hasLyrics && hasVideo) {
    layoutHeights.nowPlaying = '30%';
    layoutHeights.queue = '70%';
  } else if (!hasLyrics && !hasVideo) {
    layoutHeights.queue = '100%';
  } else {
    layoutHeights.nowPlaying = '100%';
  }

  return (
    <Box position="relative" width="100vw" height="100vh">
      <Box
        position="absolute"
        width="100%"
        height="100%"
        overflow="hidden"
        zIndex={0}
      >
        <Blurhash
          hash={blurhash ?? "LEHV6nWB2yk8pyo0adR*.7kCMdnj"}
          width="100%"
          height="100%"
          resolutionX={32}
          resolutionY={32}
          punch={1}
        />
      </Box>
        <Box
          position="absolute"
          width="100%"
          height="100%"
          bgcolor={overlayColor}
          zIndex={1}
        />
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 5,
          boxSizing: "border-box",
          overflow: "hidden",
          alignItems: "center",
          color: textColor,
          // justifyContent: "center",
          // "::before": {
          //   content: '""',
          //   position: "absolute",
          //   inset: 0,
          //   backgroundImage: `url(${nowPlayingImageUrl})`,
          //   backgroundSize: "cover",
          //   backgroundPosition: "center",
          //   filter: "blur(40px) brightness(0.4) saturate(1.5)",
          //   transform: "scale(1.2)",
          //   animation: "backgroundPan 20s ease-in-out infinite",
          //   zIndex: -1,
          // },
        }}
        >
        {/* Main content */}
        <MotionBox
          layout
          flex={1}
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          >
          <AnimatePresence mode="wait">
            {hasVideo ? (
              <MotionBox
              key="video"
              layout
              layoutId="main-video"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              sx={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3
              }}
              >
                <VideoPlayer />
              </MotionBox>
            ) : hasLyrics ? (
              <MotionBox
              key="lyrics-main"
              layout
              layoutId="lyrics"
              height='100%'
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              >
                <LyricsLrc lyrics={lyrics} position={currentPosition} />
              </MotionBox>
            ) : (
              <MotionBox
              key="nowPlaying-main"
              layout
              layoutId="now-playing"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              >
                <CurrentPlaying big/>
              </MotionBox>
            )}
          </AnimatePresence>
        </MotionBox>

        {/* Contextual panel */}
        <MotionBox
          layout
          sx={{
            width:  '25%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            height: '100%',
            gap: 2,
            paddingLeft: 5,
          }}
          >
          <AnimatePresence mode="sync">
            {hasLyrics && hasVideo && layoutHeights.lyrics !== '0%' && (
              <MotionBox
              key="lyrics-panel"
              layout
              layoutId="lyrics"
              sx={{ height: layoutHeights.lyrics }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              >
                <PlayerElement sx={{ height: '100%', paddingY: 0 }}>
                  <LyricsLrc lyrics={lyrics} position={currentPosition} />
                </PlayerElement>
              </MotionBox>
            )}

            {layoutHeights.nowPlaying !== '0%' && (
              <MotionBox
              key="nowPlaying-panel"
              layout
              layoutId="now-playing"
              sx={{ height: layoutHeights.nowPlaying }}
              transition={{ duration: 0.4 }}
              >
                <PlayerElement sx={{ height: '100%' }}>
                  <CurrentPlaying />
                </PlayerElement>
              </MotionBox>
            )}

            {layoutHeights.queue !== '0%' && nowPlaying && (
              <MotionBox
              key="queue"
              layout
              sx={{ height: layoutHeights.queue, overflow: 'hidden' }}
              transition={{ duration: 0.4 }}
              >
                <PlayerElement sx={{ height: '100%' }}>
                  <Queue
                    album={nowPlaying.album}
                    songs={nowPlaying.album.songs}
                    position={nowPlaying.nowPlaying.position}
                    />
                </PlayerElement>
              </MotionBox>
            )}
          </AnimatePresence>
        </MotionBox>
      </Box>
    </Box>
  );
};
