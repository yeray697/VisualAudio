import { useEffect } from 'react';
import { useNowPlayingStore } from '../../store/nowPlayingStore';
import { Song } from '../../types/album';
import { INowPlayingSource } from '../sources/NowPlayingSource';

export function useNowPlaying(source: INowPlayingSource | null) {
  const {
    nowPlaying,
    setNowPlaying,
    position,
    updateCurrentTrack,
    setStopped,
    setShouldListenNext,
    isStopped,
    shouldListenNext,
    resetFlags,
  } = useNowPlayingStore();

  const refreshData = () => {
    if (!source) return;
    source.getNowPlaying().then(np => {
      if (!np) return;
      // si quieres que al refrescar desde el servidor se reseteen flags,
      // usa setNowPlayingResetFlags en su lugar.
      setNowPlaying({
        ...np,
        updatedAt: new Date(),
      });
    });
  };

  useEffect(() => {
    if (!nowPlaying || isStopped || shouldListenNext) return;

    const interval = setInterval(() => {
      const np = useNowPlayingStore.getState().nowPlaying;
      if (!np) return;

      const newPosition = updateCurrentTrack();
      if (newPosition >= np.nowPlaying.duration) {
        handleTrackEnd();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [nowPlaying, isStopped, shouldListenNext]);

  useEffect(() => {
    refreshData();
  }, [source, setNowPlaying]);

  const handleTrackEnd = () => {
    const current = useNowPlayingStore.getState().nowPlaying;
    if (!current) return;

    const sortedSongs = [...current.album.songs].sort(
      (a, b) => a.position - b.position
    );
    const currentIndex = sortedSongs.findIndex(
      s => s.id === current.nowPlaying.id
    );
    const nextTrack: Song | undefined = sortedSongs[currentIndex + 1];

    if (nextTrack) {
      // Si la siguiente tiene fingerprint, indicamos que hay que escuchar
      if (nextTrack.songFingerprint?.fingerprintId) {
        setShouldListenNext(true);
      }

      setNowPlaying({
        ...current,
        nowPlaying: nextTrack,
        trackPosition: 0,
        updatedAt: new Date(),
      });
    } else {
      setStopped(true);
    }
  };

  return {
    nowPlaying,
    position,
    refreshData,
    isStopped,
    shouldListenNext,
    resetFlags,
  };
}
