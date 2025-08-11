'use client';

import { useMemo } from 'react';
import { DevNowPlayingSource } from '../../sources/DevNowPlayingSource';
import { useNowPlaying } from '../useNowPlaying';
import { DevNowPlayingControls } from './DevNowPlayingControls';

export const NowPlayingUpdater = () => {
  const devSource = useMemo(() => new DevNowPlayingSource(), []);

  // const { refreshData } = useNowPlaying(devSource);
  // useNowPlaying(devSource);

  // const backendSource = useBackendNowPlayingSource();

  // const stableSource = useMemo(() => {
  //   if (!backendSource) return null;
  //   return {
  //     async getNowPlaying() {
  //       return backendSource.getNowPlaying();
  //     }
  //   };
  // }, [backendSource]);

  // const { nowPlaying } = useNowPlaying(stableSource);

  const { refreshData } = useNowPlaying(devSource);
  return (
    <DevNowPlayingControls
      onSelectedNowPlaying={devNowPlaying => {
        devSource.setNowPlaying(devNowPlaying);
        refreshData();
      }}
    />
  );
};
