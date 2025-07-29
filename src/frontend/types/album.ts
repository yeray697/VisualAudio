export interface Song {
  id: string;
  name: string;
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