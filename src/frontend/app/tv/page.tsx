'use client';

import { Player } from './components/Player';
import { BlurhashProvider } from './components/BlurhashProvider';
import { NowPlayingUpdater } from './components/NowPlayingUpdater';
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

export default function TVPage() {
  console.log('Render <TVPage>');
  const [devDetails, setDevDetails] = useState('');
  useEffect(() => {
    setDevDetails(
      `w:${window.innerWidth};h:${window.innerHeight};dpr:${window.devicePixelRatio}`
    );
  }, []);

  return (
    <>
      <Box position="absolute">{devDetails}</Box>
      <BlurhashProvider>
        <Player />
        <NowPlayingUpdater />
      </BlurhashProvider>
    </>
  );
}
