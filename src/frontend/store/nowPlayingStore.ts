import { create } from 'zustand';
import { NowPlaying } from '../types/message';

interface NowPlayingState {
  nowPlaying: NowPlaying | null;
  setNowPlaying: (np: NowPlaying) => void;
  updateCurrentTrack: () => number;
  position?: number;
}

export const useNowPlayingStore = create<NowPlayingState>((set, get) => ({
  nowPlaying: null,
  setNowPlaying: np => set({ nowPlaying: np }),
  updateCurrentTrack: () => {
    const np = get().nowPlaying;
    if (!np) return 0;
    const elapsed = (Date.now() - new Date(np.updatedAt).getTime()) / 1000;
    const position = Math.min(
      np.trackPosition + elapsed,
      np.nowPlaying.duration
    );
    set(state => ({
      ...state,
      position,
    }));
    return position;
  },
}));
