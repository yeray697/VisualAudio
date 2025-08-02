import { create } from 'zustand'
import { AlbumFormDto, SongFormDto } from '../types/album'

type AlbumStoreActions = {
  setAlbum: (nextAlbum: Partial<AlbumFormDto>) => void
  resetAlbum: (album?: AlbumFormDto) => void
}
type AlbumSongActions = {
  addSong: (song: SongFormDto) => void
  updateSong: (index: number, updated: Partial<SongFormDto>) => void
  removeSong: (index: number) => void
  moveSong: (index: number, direction: "up" | "down") => void
}

type AlbumStore = AlbumFormDto & AlbumStoreActions & AlbumSongActions


const initialState: AlbumFormDto = {
  id: "",
  artist: "",
  title: "",
  albumImageFile: null,
  songs: [],
  albumImageFilename: undefined,
  createdAt: undefined,
  updatedAt: undefined,
}

const useAlbumAdminStore = create<AlbumStore>()((set) => ({
  ...initialState,
  
  // AlbumStoreActions
  setAlbum: (nextAlbum) =>
    set((state) => ({
      ...state,
      ...nextAlbum,
      songs: nextAlbum.songs ?? state.songs,
    })),
  resetAlbum: (album) =>
    set(() => album ?? initialState),
  // Songs
  addSong: (song) =>
    set((state) => ({
      ...state,
      songs: [...state.songs, song],
    })),
  updateSong: (index, updated) =>
    set((state) => ({
      ...state,
      songs: state.songs.map((s, i) =>
        i === index ? { ...s, ...updated } : s
      ),
    })),
  removeSong: (index) =>
    set((state) => ({
      ...state,
      songs: state.songs.filter((_, i) => i !== index),
    })),
  moveSong: (index: number, direction: "up" | "down") =>
    set((state) => {
      const newSongs = [...state.songs];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newSongs.length) return state;

      [newSongs[index], newSongs[targetIndex]] = [newSongs[targetIndex], newSongs[index]];

      const updated = newSongs.map((song, i) => ({
        ...song,
        position: i + 1,
      }));

      return { ...state, songs: updated };
    }),

}))

export default useAlbumAdminStore
