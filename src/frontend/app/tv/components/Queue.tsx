"use client";

import { Song } from '../../../types/album';
import { useState } from 'react';
import { QueueItem } from './QueueItem';
import { Box } from '@mui/material';

type Props = {
  songs: Song[],
  position: number
  albumId: string,
  fallbackImage?: string
}

export const Queue = ({ songs, position, albumId, fallbackImage } : Props) => {
  const [nextSongs] = useState(songs.filter(s=> s.position > position));

  return (
    <Box overflow='hidden'>
      {
        nextSongs.map(s => (
          <QueueItem key={s.id} albumId={albumId} song={s} fallbackImage={fallbackImage}/>
        ))
      }
    </Box>
  )
};