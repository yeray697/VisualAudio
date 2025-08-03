import { formatDurationToTime } from "../utils/timeUtils";

export interface Song {
  id: string;
  name: string;
  artist?: string;
  position: number;
  duration: number;
  fingerprintId?: string;
  songImageFilename?: string;
  songLyricsFilename?: string;
  songFilename?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  albumImageFilename?: string;
  songs: Song[];
  createdAt?: string;
  updatedAt?: string;
}

export type MetadataFileType = "AlbumImage" | "SongImage" | "Song" | "SongLyrics";

export type FileContent = {
  content: string,
  modified: boolean
}
export type FileLike = File | string | null; 

export interface SongFormDto extends Song {
  songImageFile: FileLike; // replaces songImageFilename
  songAudioFile: FileLike; // replaces songFilename
  songLyricsFileContent: FileContent | null; // replaces songLyricsFilename
  durationMinutes: number;
  durationSeconds: number;
}

export interface AlbumFormDto extends Album {
  albumImageFile: FileLike; // replaces albumImageFilename
  songs: SongFormDto[];
}

export function mapAlbumToForm(album: Album): AlbumFormDto {
  return {
    ...album,
    albumImageFile: album.albumImageFilename ?? null,
    songs: mapSongsForm(album.songs),
  };
}
export function mapSongsForm(songs: Song[]): SongFormDto[] {
  return songs.map(song => {
    const { minutes, seconds } = formatDurationToTime(song.duration);
    return {
      ...song,
      durationMinutes: minutes,
      durationSeconds: seconds,
      songImageFile: song.songImageFilename ?? null,
      songAudioFile: song.songFilename ?? null,
      songLyricsFileContent: null
    }})
    
}