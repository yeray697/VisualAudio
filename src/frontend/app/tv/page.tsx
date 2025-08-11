'use client';

import { Player } from './components/Player';
import { BlurhashProvider } from './components/BlurhashProvider';
import { NowPlayingUpdater } from './components/NowPlayingUpdater';

export default function TVPage() {
  console.log('Render <TVPage>');
  return (
    <BlurhashProvider>
      <Player />
      <NowPlayingUpdater />
    </BlurhashProvider>
  );
}
