import { formatDurationToTime } from '../utils/timeUtils';
import { Song, Album, VideoSegment, SongFingerprint, Video } from './album';
import { RelatedVideos, SongMetadata } from './album-metadata';

type Replace<
  T,
  R extends { [K in keyof R]: K extends keyof T ? unknown : never }
> = Omit<T, keyof R> & R;

export type FileLike = File | string | null;

export type FileContent = {
  content: FileLike;
  modified: boolean;
};

export interface SongFingerprintContent extends SongFingerprint {
  file?: FileContent;
}

export interface VideoContent extends Video {
  file?: FileContent;
}

export type SongFormDto = Replace<
  Song,
  {
    songFingerprint?: SongFingerprintContent;
    songVideo?: VideoContent;
  }
> & {
  songImageFile: FileLike; // replaces songImageFilename
  songLyricsFileContent: FileContent | null; // replaces songLyricsFilename
  durationMinutes: number;
  durationSeconds: number;
};

export type AlbumFormDto = Replace<
  Album,
  {
    songs: SongFormDto[];
  }
> & {
  albumImageFile: FileLike; // replaces albumImageFilename
  relatedVideos: RelatedVideos[];
};

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
      // songAudioFile: song.songFilename ?? null,
      songLyricsFileContent: song.lyrics
        ? { content: song.lyrics, modified: true }
        : null,
    };
  });
}
