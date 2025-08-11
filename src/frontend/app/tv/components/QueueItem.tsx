'use client';

import { Box, CardMedia, Typography } from '@mui/material';
import { useConfig } from '../../providers/ConfigProvider';
import { Album, Song } from '../../../types/album';
import { getSongImageWithFallback } from '../../../utils/albumFileUtils';
import { formatDurationToTimeString } from '../../../utils/timeUtils';

type Props = {
  song: Song;
  album: Album;
};

export const QueueItem = ({ song, album }: Props) => {
  console.log('Render <QueueItem>');
  const config = useConfig();
  const imageUrl = getSongImageWithFallback(
    config.apiUrl,
    song.songImageFilename,
    album.albumImageFilename,
    album.id,
    song.id
  );
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      padding={1}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={1}
      paddingRight={1}
      width="100%"
      height="auto"
      sx={{
        userSelect: 'none',
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          background: '#555',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        },
        cursor: 'pointer',
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Typography width="2ch">{song.position}</Typography>
        <Box
          width="56px"
          height="100%"
          sx={{
            aspectRatio: '1 / 1',
            maxHeight: '100%',
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
            image={imageUrl ?? undefined}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          position: 'relative',
          flex: 1,
        }}
      >
        <Box
          sx={{ flexBasis: '33.33%', textAlign: 'left', overflow: 'hidden' }}
        >
          <Typography fontWeight="bold" noWrap textOverflow="ellipsis">
            {song.name}
          </Typography>
        </Box>

        <Box
          sx={{
            flexBasis: '33.33%',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography noWrap textOverflow="ellipsis">
            {song.artist ?? album.artist ?? '(No artist)'}
          </Typography>
        </Box>

        <Box sx={{ flexBasis: '33.33%', textAlign: 'right' }}>
          <Typography fontWeight="bold" noWrap textOverflow="ellipsis">
            {formatDurationToTimeString(song.duration)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
