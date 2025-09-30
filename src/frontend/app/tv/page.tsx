'use client';

import { Player } from './components/Player';
import { BlurhashProvider } from './components/BlurhashProvider';
import { NowPlayingUpdater } from './components/NowPlayingUpdater';

export default function TVPage() {
  console.log('Render <TVPage>');
  console.log(
    'Viewport:',
    window.innerWidth,
    window.innerHeight,
    window.devicePixelRatio
  );

  return (
    <BlurhashProvider>
      <Player />
      <NowPlayingUpdater />
    </BlurhashProvider>
  );
}
