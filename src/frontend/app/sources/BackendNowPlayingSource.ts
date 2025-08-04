import { useMemo } from "react";
import { useNowPlaying } from "../hooks/useNowPlayingData";
import { INowPlayingSource } from "./NowPlayingSource";
import { Song } from "../../types/album";

export function useBackendNowPlayingSource(): INowPlayingSource | null {
  const { data } = useNowPlaying(true);

  const findCurrentTrack = (
    songs: Song[],
    elapsed: number,
    startingTrackId?: string
  ): { song: Song; pos: number } => {
    const sorted = [...songs].sort((a, b) => a.position - b.position);


    let startIndex = 0;
    if (startingTrackId) {
      const idx = sorted.findIndex((s) => s.id === startingTrackId);
      if (idx >= 0) startIndex = idx; // arrancamos desde la canción que el servidor dice
    }

    let acc = 0;

    for (let i = startIndex; i < sorted.length; i++) {
      const track = sorted[i];
      if (elapsed < acc + track.duration) {
        return { song: track, pos: elapsed - acc };
      }
      acc += track.duration;
    }
    const last = sorted[sorted.length - 1];
    return { song: last, pos: last.duration };
  }
  return useMemo(() => {
    if (!data) return null;
    return {
      async getNowPlaying() {
        
        const elapsed = (Date.now() - new Date(data.updatedAt).getTime()) / 1000;
        const playbackPos = data.trackPosition + elapsed;

        const { song, pos } = findCurrentTrack(data.album.songs, playbackPos, data.nowPlaying.id);
        return {
          ...data,
          nowPlaying: song,
          trackPosition: pos,
        };
      }
    };
  }, [data]);
}

// import { Song } from "../../types/album";
// import { NowPlaying } from "../../types/message";
// import { INowPlayingSource } from "./NowPlayingSource";

// export class BackendNowPlayingSource implements INowPlayingSource {
//   constructor(private endpoint: string) {}

//   async getNowPlaying(): Promise<NowPlaying> {
//     const response = await fetch(this.endpoint);
//     const data: NowPlaying = await response.json();

//     const elapsed = (Date.now() - new Date(data.updatedAt).getTime()) / 1000;
//     const playbackPos = data.trackPosition + elapsed;

//     const { song, pos } = this.findCurrentTrack(data.album.songs, playbackPos, data.nowPlaying.id);
//     return {
//       ...data,
//       nowPlaying: song,
//       trackPosition: pos,
//     };
//   }

//   private findCurrentTrack(
//     songs: Song[],
//     elapsed: number,
//     startingTrackId?: string
//   ): { song: Song; pos: number } {
//     const sorted = [...songs].sort((a, b) => a.position - b.position);
//     let acc = 0;
//     for (const track of sorted) {
//       if (elapsed < acc + track.duration) {
//         return { song: track, pos: elapsed - acc };
//       }
//       acc += track.duration;
//     }
//     const last = sorted[sorted.length - 1];
//     return { song: last, pos: last.duration };
//   }
// }
