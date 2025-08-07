"use client";

import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { formatDurationToTimeString } from '../../../utils/timeUtils';
import { useConfig } from '../../providers/ConfigProvider';
import { getAlbumFileUrl } from '../../../utils/albumFileUtils';

export const CurrentPlaying = () => {
  const config = useConfig();
  const { nowPlaying } = useNowPlayingStore();
  const getCurrentPosition = useNowPlayingStore((s) => s.getCurrentPosition);

  const currentPosition = getCurrentPosition();
  const positionStr = nowPlaying ? formatDurationToTimeString(currentPosition) : "";
  const durationStr = nowPlaying ? formatDurationToTimeString(nowPlaying.nowPlaying.duration) : "";
  const positionDisplay = nowPlaying ? `${positionStr} / ${durationStr}` : "";

  const nowPlayingImageUrl = (nowPlaying && getAlbumFileUrl(
    config.apiUrl,
    nowPlaying.nowPlaying.songImageFilename ?? nowPlaying.album.albumImageFilename,
    nowPlaying.album.id,
    nowPlaying.nowPlaying.songImageFilename ? nowPlaying.nowPlaying.id : undefined 
  )) ?? undefined;
  
  return (
    <div>
      {nowPlaying && 
        <>
          <h2>Canción detectada</h2>
          <p>
            <strong>{nowPlaying.nowPlaying.name}</strong> - {nowPlaying.album.artist}
          </p>
          <p>
            <em>{nowPlaying.album.title}</em>
          </p>
          <p>
            Confidence <em>{nowPlaying.confidence * 100} %</em>
          </p>
          <div>
            <input
              type="range"
              min={0}
              value={currentPosition}
              max={nowPlaying.nowPlaying.duration}
              onChange={() => {}}
              style={{ width: "100%" }}
            />
            <p>{positionDisplay}</p>
          </div>
        </>
      }
    </div>
  );
};