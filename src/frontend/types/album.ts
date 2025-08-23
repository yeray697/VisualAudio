export interface VideoSegment {
  start: number;
  end: number;
}

export interface Video {
  jobId?: string;
  filename?: string;
  videoUrl: string;
  segments: VideoSegment[];
  maxQuality: string;
}

export interface SongFingerprint {
  jobId?: string;
  filename?: string;
  fingerprintId?: string;
}

export interface Song {
  id: string;
  name: string;
  artist?: string;
  position: number;
  duration: number;
  songFingerprint?: SongFingerprint;
  songImageFilename?: string;
  songLyricsFilename?: string;
  songVideo?: Video;
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  id: string;
  albumType: AlbumType;
  title: string;
  artist: string;
  albumImageFilename?: string;
  songs: Song[];
  createdAt?: string;
  updatedAt?: string;
}

export const albumTypes = ['CD', 'LP', 'Casette'] as const;
export type AlbumType = (typeof albumTypes)[number];

export type MetadataFileType =
  | 'AlbumImage'
  | 'SongImage'
  | 'Song'
  | 'SongLyrics'
  | 'SongVideo';
