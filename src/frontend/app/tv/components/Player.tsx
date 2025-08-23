'use client';

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
import { Blurhash } from 'react-blurhash';
import { useBlurhashContext } from './BlurhashProvider';

const MotionBox = motion(Box);

export const Player = () => {
  console.log('Render <Player>');
  const config = useConfig();
  const nowPlaying = useNowPlayingStore(state => state.nowPlaying);
  const { setImageUrl } = useBlurhashContext();
  const { textColor, overlayColor, blurhash } = useBlurhashContext();

  const { data: lyricsBlob } = useGetAlbumFile(
    nowPlaying?.nowPlaying.songLyricsFilename,
    nowPlaying?.album.id ?? '',
    nowPlaying?.nowPlaying.id,
    !!nowPlaying?.nowPlaying.id && !!nowPlaying?.nowPlaying.songLyricsFilename
  );

  const [lyrics, setLyrics] = useState('');

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
          nowPlaying.nowPlaying.songImageFilename ??
            nowPlaying.album.albumImageFilename,
          nowPlaying.album.id,
          nowPlaying.nowPlaying.songImageFilename
            ? nowPlaying.nowPlaying.id
            : undefined
        )) ??
      undefined;

    if (!nowPlayingImageUrl) return;
    setImageUrl(nowPlayingImageUrl);
  }, [nowPlaying, config.apiUrl, setImageUrl]);

  const videoUrl =
    (nowPlaying?.nowPlaying.songVideo?.filename
      ? getAlbumFileUrl(
          config.apiUrl,
          nowPlaying.nowPlaying.songVideo?.filename,
          nowPlaying.album.id,
          nowPlaying.nowPlaying.id
        )
      : null) ?? 'https://www.youtube.com/embed/5mGuCdlCcNM?autoplay=1&mute=1';
  const hasLyrics = !!nowPlaying?.nowPlaying.songLyricsFilename;
  const hasVideo = (nowPlaying?.nowPlaying.position ?? 2) % 2; // TODO: toggle this

  // Calcualte side panel sizes
  const layouts = {
    nowPlaying: false,
    lyrics: false,
    queue: -1,
  };

  if (hasLyrics && !hasVideo) {
    layouts.nowPlaying = true;
    layouts.queue = 5;
  } else if (hasLyrics && hasVideo) {
    layouts.nowPlaying = true;
    layouts.lyrics = true;
    layouts.queue = 1;
  } else if (!hasLyrics && hasVideo) {
    layouts.nowPlaying = true;
    layouts.queue = 5;
  } else if (!hasLyrics && !hasVideo) {
  } else {
    layouts.nowPlaying = true;
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
          hash={blurhash ?? 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
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
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: 5,
          boxSizing: 'border-box',
          overflow: 'hidden',
          alignItems: 'center',
          color: textColor,
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
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 3,
                }}
              >
                <VideoPlayer videoUrl={videoUrl} />
              </MotionBox>
            ) : hasLyrics ? (
              <MotionBox
                key="lyrics-main"
                layout
                layoutId="lyrics"
                height="100%"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <LyricsLrc lyrics={lyrics} />
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
                <CurrentPlaying big />
              </MotionBox>
            )}
          </AnimatePresence>
        </MotionBox>

        {/* Contextual panel */}
        <MotionBox
          layout
          sx={{
            width: 'max(25%, 400px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
            paddingLeft: 5,
            minHeight: 0,
          }}
        >
          <AnimatePresence mode="sync">
            {layouts.lyrics && (
              <MotionBox
                key="lyrics-panel"
                layout
                layoutId="lyrics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <PlayerElement sx={{ paddingY: 0 }}>
                  <LyricsLrc lyrics={lyrics} />
                </PlayerElement>
              </MotionBox>
            )}

            {layouts.nowPlaying && (
              <MotionBox
                key="nowPlaying-panel"
                layout
                layoutId="now-playing"
                transition={{ duration: 0.4 }}
                sx={{
                  flexShrink: 0,
                }}
              >
                <PlayerElement>
                  <CurrentPlaying />
                </PlayerElement>
              </MotionBox>
            )}

            {nowPlaying && (
              <MotionBox
                key="queue"
                layout
                sx={{
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
                transition={{ duration: 0.4 }}
              >
                <Queue
                  album={nowPlaying.album}
                  songs={nowPlaying.album.songs}
                  position={nowPlaying.nowPlaying.position}
                  maxItems={layouts.queue}
                />
              </MotionBox>
            )}
          </AnimatePresence>
        </MotionBox>
      </Box>
    </Box>
  );
};
