import { create } from 'zustand';
import { AlbumFormDto, SongFormDto } from '../types/album';

type AlbumStoreActions = {
  setAlbum: (nextAlbum: Partial<AlbumFormDto>) => void;
  resetAlbum: (album?: AlbumFormDto) => void;
};
type AlbumSongActions = {
  addSong: (song: SongFormDto) => void;
  updateSong: (id: string, updated: Partial<SongFormDto>) => void;
  removeSong: (id: string) => void;
  moveSong: (index: number, direction: 'up' | 'down') => void;
};

type AlbumStore = AlbumFormDto & AlbumStoreActions & AlbumSongActions;

const initialState: AlbumFormDto = {
  id: '',
  albumType: 'LP',
  artist: '',
  title: '',
  albumImageFile: null,
  songs: [],
  albumImageFilename: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  relatedVideos: [],
};

const useAlbumAdminStore = create<AlbumStore>()(set => ({
  ...initialState,

  // AlbumStoreActions
  setAlbum: nextAlbum =>
    set(state => ({
      ...state,
      ...nextAlbum,
      songs: nextAlbum.songs ?? state.songs,
    })),
  resetAlbum: album => set(() => album ?? initialState),
  // Songs
  addSong: song =>
    set(state => ({
      ...state,
      songs: [...state.songs, song],
    })),
  updateSong: (id, updated) =>
    set(state => ({
      ...state,
      songs: state.songs.map(s => (s.id === id ? { ...s, ...updated } : s)),
    })),
  removeSong: id =>
    set(state => {
      const filteredSongs = state.songs.filter(s => s.id !== id);
      const updatedSongs = filteredSongs.map((song, i) => ({
        ...song,
        position: i + 1,
      }));
      return {
        ...state,
        songs: updatedSongs,
      };
    }),
  moveSong: (index: number, direction: 'up' | 'down') =>
    set(state => {
      const newSongs = [...state.songs];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newSongs.length) return state;

      [newSongs[index], newSongs[targetIndex]] = [
        newSongs[targetIndex],
        newSongs[index],
      ];

      const updated = newSongs.map((song, i) => ({
        ...song,
        position: i + 1,
      }));

      return { ...state, songs: updated };
    }),
}));

export default useAlbumAdminStore;
