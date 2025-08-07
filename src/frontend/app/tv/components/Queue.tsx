"use client";

import { Album, Song } from '../../../types/album';
import { useState } from 'react';
import { QueueItem } from './QueueItem';
import { Box } from '@mui/material';

type Props = {
  songs: Song[],
  position: number
  album: Album
}

export const Queue = ({ songs, position, album } : Props) => {
  const [nextSongs] = useState(songs.filter(s=> s.position > position));

  return (
    <Box overflow='hidden'>
      {
        nextSongs.map(s => (
          <QueueItem key={s.id} album={album} song={s}/>
        ))
      }
    </Box>
  )
};