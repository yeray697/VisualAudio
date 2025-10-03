'use client';

import { Player } from './components/Player';
import { BlurhashProvider } from './components/BlurhashProvider';
import { NowPlayingUpdater } from './components/NowPlayingUpdater';
import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

export default function TVPage() {
  const [devDetails, setDevDetails] = useState('');
  useEffect(() => {
    setDevDetails(
      `inner: ${window.innerWidth}x${window.innerHeight}; ` +
        `screen: ${screen.width}x${screen.height}; ` +
        `dpr: ${window.devicePixelRatio}`
    );
  }, []);

  return (
    <>
      <Box position="absolute" zIndex={5}>
        {devDetails}
      </Box>
      <BlurhashProvider>
        <Player />
        <NowPlayingUpdater />
      </BlurhashProvider>
    </>
  );
}
