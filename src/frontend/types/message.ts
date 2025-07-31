import { Song, Album } from "./album";

export type Message = {
  data: Match,
  type: string,
  messageReceived?: string
}

export type Match = {
  nowPlaying: Song;
  times: {
    trackMatchStart: number;
    queryMatchStart: number;
    recordedDuration: number;
    latency: number;
  };
  album: Album;
  confidence: number;
};


export type NowPlaying = {
  updatedAt: Date;
  nowPlaying: Song;
  album: Album;
  confidence: number;
  trackPosition: number;
};