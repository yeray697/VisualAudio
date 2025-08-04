// useNowPlaying.ts
import { useEffect } from "react";
import { useNowPlayingStore } from "../../store/nowPlayingStore";
import { Song } from "../../types/album";
import { INowPlayingSource } from "../sources/NowPlayingSource";

export function useNowPlaying(source: INowPlayingSource | null) {
  const { nowPlaying, setNowPlaying, getCurrentPosition } = useNowPlayingStore();

  useEffect(() => {
    if (!source) return;
    source.getNowPlaying().then((np) => {
      setNowPlaying({
        ...np,
        updatedAt: new Date(),
      });
    });
  }, [source, setNowPlaying]);

  // manejar fin de track
  useEffect(() => {
    if (!nowPlaying) return;
    if (getCurrentPosition() >= nowPlaying.nowPlaying.duration) handleTrackEnd();
  });

  const handleTrackEnd = () => {
    const current = useNowPlayingStore.getState().nowPlaying;
    if (!current) return;
    const sortedSongs = [...current.album.songs].sort((a, b) => a.position - b.position);
    const currentIndex = sortedSongs.findIndex((s) => s.id === current.nowPlaying.id);
    const nextTrack: Song | undefined = sortedSongs[currentIndex + 1];

    if (nextTrack) {
      setNowPlaying({
        ...current,
        nowPlaying: nextTrack,
        trackPosition: 0,
        updatedAt: new Date(),
      });
    } else {
      setNowPlaying({
        ...current,
        trackPosition: current.nowPlaying.duration,
        updatedAt: new Date(),
      });
    }
  };

  return { nowPlaying, getCurrentPosition };
}
