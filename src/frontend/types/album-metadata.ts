import { Song, Album } from './album';

export interface RelatedVideos {
  title: string;
  description: string;
  uri: string;
  duration: number;
}
export interface SongMetadata extends Song {
  lyrics?: string;
}
export interface AlbumMetadata extends Album {
  songs: SongMetadata[];
  relatedVideos: RelatedVideos[];
}

export type MetadataFileType =
  | 'AlbumImage'
  | 'SongImage'
  | 'Song'
  | 'SongLyrics'
  | 'SongVideo';
