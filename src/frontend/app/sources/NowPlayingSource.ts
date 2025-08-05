import { NowPlaying } from "../../types/message";

export interface INowPlayingSource {
  getNowPlaying(): Promise<NowPlaying | undefined>;
}
