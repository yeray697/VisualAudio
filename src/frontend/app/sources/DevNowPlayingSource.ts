import { NowPlaying } from "../../types/message";
import { INowPlayingSource } from "./NowPlayingSource";

export class DevNowPlayingSource implements INowPlayingSource {
  private mockData?: NowPlaying;
  
  constructor() {
  }
  async getNowPlaying(): Promise<NowPlaying | undefined> {
    return this.mockData;
  }
  setNowPlaying(mockData: NowPlaying) {
    this.mockData = mockData;
  }
}
