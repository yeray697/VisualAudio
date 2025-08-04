// nowPlayingStore.ts
import { create } from 'zustand';
import { NowPlaying } from '../types/message';

interface NowPlayingState {
  nowPlaying: NowPlaying | null;
  setNowPlaying: (np: NowPlaying) => void;
  getCurrentPosition: () => number;
}

export const useNowPlayingStore = create<NowPlayingState>((set, get) => ({
  nowPlaying: null,
  setNowPlaying: (np) => set({ nowPlaying: np }),
  getCurrentPosition: () => {
    const np = get().nowPlaying;
    if (!np) return 0;
    const elapsed = (Date.now() - new Date(np.updatedAt).getTime()) / 1000;
    return Math.min(np.trackPosition + elapsed, np.nowPlaying.duration);
  }
}));
