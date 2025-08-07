"use client";

import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { formatDurationToTimeString } from '../../../utils/timeUtils';
import { useConfig } from '../../providers/ConfigProvider';
import { getSongImageWithFallback } from '../../../utils/albumFileUtils';
import { Box, CardMedia, LinearProgress, Typography } from '@mui/material';

export const CurrentPlaying = () => {
  const config = useConfig();
  const { nowPlaying } = useNowPlayingStore();
  const getCurrentPosition = useNowPlayingStore((s) => s.getCurrentPosition);

  const currentPosition = getCurrentPosition();
  const positionStr = nowPlaying ? formatDurationToTimeString(currentPosition) : "";
  const durationStr = nowPlaying ? formatDurationToTimeString(nowPlaying.nowPlaying.duration) : "";
  const positionDisplay = nowPlaying ? `${positionStr} / ${durationStr}` : "";

  const nowPlayingImageUrl = (nowPlaying && getSongImageWithFallback(
    config.apiUrl,
    nowPlaying.nowPlaying.songImageFilename,
    nowPlaying.album.albumImageFilename,
    nowPlaying.album.id,
    nowPlaying.nowPlaying.id
  ))
  return (
    <>
      {nowPlaying && 
        <Box display='flex' height='100%' gap={1}>
          <Box height='100%'>
            <CardMedia
              component="img"
              width='100%'
              height='100%'
              sx={{
                objectFit: 'cover',
                borderRadius: '15px'
              }}
              
              image={nowPlayingImageUrl ?? undefined}
            />
          </Box>
          <Box display='flex' flex={1} flexDirection='column' justifyContent='flex-end' gap={1}>
            <Box display='flex' flex={1} justifyContent='center' flexDirection='column' alignItems='center' gap={1}>
              <Typography fontSize='1.25rem' fontWeight='bold'>{nowPlaying.nowPlaying.name}</Typography>
              <Typography fontSize='1rem' fontWeight='regular'>{nowPlaying.nowPlaying.artist ?? nowPlaying.album.artist ?? "(No artist)"}</Typography>
              <Typography fontSize='0.90rem' fontWeight='regular' >{nowPlaying.album.title}</Typography>
            </Box>
            <Box display='flex' flexDirection='column' alignItems='flex-end' width='100%' gap={1}>
              <LinearProgress sx={{ width: '100%', height: '5px', borderRadius: 1}} variant="determinate" value={currentPosition * 100 / nowPlaying.nowPlaying.duration} />
              <Typography variant='subtitle2'>{positionDisplay}</Typography>
            </Box>
          </Box>
        </Box>
      }
    </>
  );
};