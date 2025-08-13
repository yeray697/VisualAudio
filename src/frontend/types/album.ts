import { formatDurationToTime } from '../utils/timeUtils';

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
  songVideoFilename?: string;
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
export const albumTypes = ['CD', 'LP', 'Casette'] as const;
export type AlbumType = (typeof albumTypes)[number];

export type FileContent = {
  content: string;
  modified: boolean;
};
export type FileLike = File | string | null;

export interface SongFormDto extends Song {
  songImageFile: FileLike; // replaces songImageFilename
  songAudioFile: FileLike; // replaces songFilename
  songLyricsFileContent: FileContent | null; // replaces songLyricsFilename
  durationMinutes: number;
  durationSeconds: number;
  video?: VideoRequestFormDto;
}

export interface VideoSegmentDto {
  start: number;
  end: number;
}

export interface VideoRequestFormDto {
  videoUrl: string;
  segments: VideoSegmentDto[];
  maxQuality: string;
}

export interface VideoRequestDto extends VideoRequestFormDto {
  songId: string;
  albumId: string;
}

export interface AlbumFormDto extends Album {
  albumImageFile: FileLike; // replaces albumImageFilename
  songs: SongFormDto[];
  relatedVideos: RelatedVideos[];
}

export function mapAlbumToForm(album: Album): AlbumFormDto {
  return {
    ...album,
    albumImageFile: album.albumImageFilename ?? null,
    songs: mapSongsForm(album.songs),
    relatedVideos: [],
  };
}
export function mapSongsForm(songs: SongMetadata[]): SongFormDto[] {
  return songs.map(song => {
    const { minutes, seconds } = formatDurationToTime(song.duration);
    return {
      ...song,
      durationMinutes: minutes,
      durationSeconds: seconds,
      songImageFile: song.songImageFilename ?? null,
      songAudioFile: song.songFilename ?? null,
      songLyricsFileContent: song.lyrics
        ? { content: song.lyrics, modified: true }
        : null,
    };
  });
}
