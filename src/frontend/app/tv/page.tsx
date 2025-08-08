"use client";

import { useMemo } from "react";
import { DevNowPlayingSource } from "../sources/DevNowPlayingSource";
import { DevNowPlayingControls } from "./components/DevNowPlayingControls";
import { useNowPlaying } from "./useNowPlaying";
import { useBackendNowPlayingSource } from "../sources/BackendNowPlayingSource";
import { Player } from "./components/Player";
import { BlurhashProvider } from "./components/BlurhashProvider";

export default function TVPage() {



  const devSource = useMemo(() => new DevNowPlayingSource(), []);

  const { refreshData } = useNowPlaying(devSource);

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



  return (
    <BlurhashProvider>
      <DevNowPlayingControls 
        onSelectedNowPlaying={(devNowPlaying) => {
          devSource.setNowPlaying(devNowPlaying)
          refreshData();
        }}
        />
      <Player />
    </BlurhashProvider>
  );
}
