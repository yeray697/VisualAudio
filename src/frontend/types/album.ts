export interface Song {
  id: string;
  name: string;
  artist?: string;
  position: number;
  duration: number;
  fingerprintId?: string;
  songImageFilename?: string;
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

export type MetadataFileType = "AlbumImage" | "SongImage" | "Song";

export type FileLike = File | string | null; 

export interface SongFormDto extends Song {
  songImageFile: FileLike; // replaces songImageFilename
  songAudioFile: FileLike; // replaces songFilename
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
  return songs.map(song => ({
      ...song,
      songImageFile: song.songImageFilename ?? null,
      songAudioFile: song.songFilename ?? null
    }))
    
}