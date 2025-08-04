import { NowPlaying } from "../../types/message";
import { INowPlayingSource } from "./NowPlayingSource";

export class DevNowPlayingSource implements INowPlayingSource {
  constructor(private mockData: NowPlaying) {}
  async getNowPlaying(): Promise<NowPlaying> {
    return this.mockData;
  }
}
