'use client';

import { useRef } from 'react';
import { Album, Song } from '../../../types/album';
import { QueueItem } from './QueueItem';
import { Box } from '@mui/material';
import { PlayerElement } from './PlayerElement';

type Props = {
  songs: Song[];
  position: number;
  album: Album;
  maxItems: number;
};

export const Queue = ({ songs, position, album, maxItems }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  let visibleSongs = songs.filter(s => s.position > position);
  if (maxItems > 0) visibleSongs = visibleSongs.slice(0, maxItems);

  return (
    visibleSongs.length > 0 && (
      <PlayerElement sx={{ height: '100%' }}>
        <Box ref={ref} overflow="hidden" height="100%">
          {visibleSongs.map(s => (
            <QueueItem key={s.id} album={album} song={s} />
          ))}
        </Box>
      </PlayerElement>
    )
  );
};
