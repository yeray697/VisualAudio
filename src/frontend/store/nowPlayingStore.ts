import { create } from 'zustand';
import { NowPlaying } from '../types/message';

interface NowPlayingState {
  nowPlaying: NowPlaying | null;
  setNowPlaying: (np: NowPlaying) => void;
  setNowPlayingResetFlags: (np: NowPlaying) => void;
  updateCurrentTrack: () => number;
  position?: number;

  isStopped: boolean;
  shouldListenNext: boolean;
  setStopped: (stopped: boolean) => void;
  setShouldListenNext: (listen: boolean) => void;
  resetFlags: () => void; // limpia flags manualmente
}

export const useNowPlayingStore = create<NowPlayingState>((set, get) => ({
  nowPlaying: null,
  position: 0,
  isStopped: false,
  shouldListenNext: true,

  setNowPlaying: (np: NowPlaying) =>
    set({ nowPlaying: np, position: np.trackPosition }),

  setNowPlayingResetFlags: (np: NowPlaying) =>
    set({ nowPlaying: np, isStopped: false, shouldListenNext: false }),

  updateCurrentTrack: () => {
    const np = get().nowPlaying;
    if (!np) return 0;
    const elapsed = (Date.now() - new Date(np.updatedAt).getTime()) / 1000;
    const position = Math.min(
      np.trackPosition + elapsed,
      np.nowPlaying.duration
    );
    set({ position });
    return position;
  },

  setStopped: (stopped: boolean) => set({ isStopped: stopped }),
  setShouldListenNext: (listen: boolean) => set({ shouldListenNext: listen }),
  resetFlags: () => set({ shouldListenNext: false, isStopped: false }),
}));
