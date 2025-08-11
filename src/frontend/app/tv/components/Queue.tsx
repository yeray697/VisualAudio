'use client';

import { useRef, useState, useEffect } from 'react';
import { Album, Song } from '../../../types/album';
import { QueueItem } from './QueueItem';
import { Box } from '@mui/material';

type Props = {
  songs: Song[];
  position: number;
  album: Album;
  maxItems: number;
};

export const Queue = ({ songs, position, album, maxItems }: Props) => {
  console.log('Render <Queue>');
  const ref = useRef<HTMLDivElement>(null);

  let visibleSongs = songs.filter(s => s.position > position);
  if (maxItems > 0) visibleSongs = visibleSongs.slice(0, maxItems);

  return (
    <Box ref={ref} overflow="hidden" height="100%">
      {visibleSongs.map(s => (
        <QueueItem key={s.id} album={album} song={s} />
      ))}
    </Box>
  );
};
