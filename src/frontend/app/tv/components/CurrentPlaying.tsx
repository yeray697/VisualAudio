'use client';

import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { useConfig } from '../../providers/ConfigProvider';
import { getSongImageWithFallback } from '../../../utils/albumFileUtils';
import { Box, CardMedia, Typography } from '@mui/material';
import { MusicProgressBar } from './MusicProgressBar';

type Props = {
  big?: boolean;
};
export const CurrentPlaying = ({ big }: Props) => {
  console.log('Render <CurrentPlaying>');
  const config = useConfig();
  const nowPlaying = useNowPlayingStore(state => state.nowPlaying);

  const nowPlayingImageUrl =
    nowPlaying &&
    getSongImageWithFallback(
      config.apiUrl,
      nowPlaying.nowPlaying.songImageFilename,
      nowPlaying.album.albumImageFilename,
      nowPlaying.album.id,
      nowPlaying.nowPlaying.id
    );
  return (
    <>
      {nowPlaying && (
        <Box
          display="flex"
          height="100%"
          gap={1}
          flexDirection={big ? 'column' : 'row'}
        >
          <Box
            height="100%"
            sx={{
              aspectRatio: '1 / 1',
              maxHeight: big ? 'max(200px, 50vh)' : 'clamp(120px, 20vh, 250px)',
            }}
          >
            <CardMedia
              component="img"
              width="100%"
              height="100%"
              sx={{
                objectFit: 'cover',
                borderRadius: '15px',
              }}
              image={nowPlayingImageUrl ?? undefined}
            />
          </Box>
          <Box
            display="flex"
            flex={1}
            flexDirection="column"
            justifyContent="flex-end"
            gap={1}
          >
            <Box
              display="flex"
              flex={1}
              justifyContent="center"
              flexDirection="column"
              alignItems="center"
              gap={1}
            >
              <Typography fontSize="1.25rem" fontWeight="bold">
                {nowPlaying.nowPlaying.name}
              </Typography>
              <Typography fontSize="1rem" fontWeight="regular">
                {nowPlaying.nowPlaying.artist ??
                  nowPlaying.album.artist ??
                  '(No artist)'}
              </Typography>
              <Typography fontSize="0.90rem" fontWeight="regular">
                {nowPlaying.album.title}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="flex-end"
              width="100%"
              gap={1}
            >
              <MusicProgressBar duration={nowPlaying.nowPlaying.duration} />
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};
