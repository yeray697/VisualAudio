'use client';

import {
  Box,
  Button,
  IconButton,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import DeleteIcon from '@mui/icons-material/Delete';
import useAlbumAdminStore from '../../../../store/adminAlbumForm';
import { VideoSegment } from '../../../../types/album';
import { useShallow } from 'zustand/shallow';

interface Props {
  videoUrl?: string;
  songDuration: number;
  songId: string;
}
export default function AlbumVideoEditor({ videoUrl, songId }: Props) {
  const song = useAlbumAdminStore(
    useShallow(state => state.songs.filter(s => s.id === songId)[0])
  );
  const songDuration = song.duration;
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [quality, setQuality] = useState(song.songVideo?.maxQuality ?? '2160');
  const [segments, setSegments] = useState<VideoSegment[]>(
    song.songVideo?.segments ?? [{ start: 0, end: songDuration }]
  );
  const updateSong = useAlbumAdminStore(state => state.updateSong);
  const initialState = {
    pip: false,
    playing: false,
    controls: true,
    light: false,
    volume: 1,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false,
    seeking: false,
    loadedSeconds: 0,
    playedSeconds: 0,
  };

  type PlayerState = typeof initialState;

  const [state, setState] = useState<PlayerState>(initialState);

  const handleRateChange = () => {
    const player = playerRef.current;
    if (!player) return;

    setState(prevState => ({
      ...prevState,
      playbackRate: player.playbackRate,
    }));
  };
  const handlePlay = () => {
    console.log('onPlay');
    setState(prevState => ({ ...prevState, playing: true }));
  };

  const handleEnterPictureInPicture = () => {
    console.log('onEnterPictureInPicture');
    setState(prevState => ({ ...prevState, pip: true }));
  };

  const handleLeavePictureInPicture = () => {
    console.log('onLeavePictureInPicture');
    setState(prevState => ({ ...prevState, pip: false }));
  };

  const handlePause = () => {
    console.log('onPause');
    setState(prevState => ({ ...prevState, playing: false }));
  };

  const handleProgress = () => {
    const player = playerRef.current;
    // We only want to update time slider if we are not currently seeking
    if (!player || state.seeking || !player.buffered?.length) return;

    console.log('onProgress');

    setState(prevState => ({
      ...prevState,
      loadedSeconds: player.buffered?.end(player.buffered?.length - 1),
      loaded:
        player.buffered?.end(player.buffered?.length - 1) / player.duration,
    }));
  };

  const handleTimeUpdate = () => {
    const player = playerRef.current;
    // We only want to update time slider if we are not currently seeking
    if (!player || state.seeking) return;

    console.log('onTimeUpdate', player.currentTime);

    if (!player.duration) return;

    setState(prevState => ({
      ...prevState,
      playedSeconds: player.currentTime,
      played: player.currentTime / player.duration,
    }));
  };

  const handleEnded = () => {
    console.log('onEnded');
    setState(prevState => ({ ...prevState, playing: prevState.loop }));
  };

  const handleDurationChange = () => {
    const player = playerRef.current;
    if (!player) return;

    console.log('onDurationChange', player.duration);
    setState(prevState => ({ ...prevState, duration: player.duration }));
  };

  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return;
    playerRef.current = player;
    console.log(player);
  }, []);

  const {
    playing,
    controls,
    light,
    volume,
    muted,
    loop,
    played,
    loaded,
    duration,
    playbackRate,
    pip,
  } = state;

  useEffect(() => {
    updateSong(songId, {
      songVideo: {
        ...(song.songVideo ?? {}),
        maxQuality: quality,
        videoUrl: videoUrl!,
        segments,
      },
    });
  }, [segments, videoUrl, quality]);

  const updateSegment = (index: number, values: number | number[]) => {
    if (!Array.isArray(values)) return;
    const updated = [...segments];
    const start = values[0];
    const end = values[1];
    const existingSegment = updated[index];
    if (existingSegment.end === end) {
      // Moved start
      if (playerRef.current) playerRef.current.currentTime = start;
    } else {
      //Moved end
      if (playerRef.current) playerRef.current.currentTime = end;
    }
    updated[index] = { start, end };
    setSegments(updated);
  };

  const addSegment = () => {
    setSegments([...segments, { start: 0, end: Math.min(5, duration) }]);
  };

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const getSegmentDuration = () => {
    return segments.reduce(
      (sum, current) => sum + (current.end - current.start),
      0
    );
  };
  return (
    <Box>
      <TextField
        label="Max video quality"
        fullWidth
        value={quality}
        onClick={e => e.stopPropagation()}
        onChange={e => setQuality(e.target.value)}
      />
      <ReactPlayer
        ref={setPlayerRef}
        className="react-player"
        style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
        src={videoUrl}
        pip={pip}
        playing={playing}
        controls={controls}
        light={light}
        loop={loop}
        playbackRate={playbackRate}
        volume={volume}
        muted={muted}
        config={{
          youtube: {
            color: 'white',
          },
          vimeo: {
            color: 'ffffff',
          },
          spotify: {
            preferVideo: true,
          },
          tiktok: {
            fullscreen_button: true,
            progress_bar: true,
            play_button: true,
            volume_control: true,
            timestamp: false,
            music_info: false,
            description: false,
            rel: false,
            native_context_menu: true,
            closed_caption: false,
          },
        }}
        onLoadStart={() => console.log('onLoadStart')}
        onReady={() => console.log('onReady')}
        onStart={e => console.log('onStart', e)}
        onPlay={handlePlay}
        onEnterPictureInPicture={handleEnterPictureInPicture}
        onLeavePictureInPicture={handleLeavePictureInPicture}
        onPause={handlePause}
        onRateChange={handleRateChange}
        onSeeking={e => console.log('onSeeking', e)}
        onSeeked={e => console.log('onSeeked', e)}
        onEnded={handleEnded}
        onError={e => console.log('onError', e)}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onDurationChange={handleDurationChange}
      />

      <Box style={{ margin: '20px' }}>
        <Box display="flex" justifyContent="space-between" paddingY={2}>
          <Typography>Song Duration: {songDuration}</Typography>
          <Typography>
            Total Segment Duration: {getSegmentDuration()}s
          </Typography>
          <Typography>
            Remaining time: {songDuration - getSegmentDuration()}s
          </Typography>
          <Button onClick={addSegment}>Añadir segmento</Button>
        </Box>
        {segments.map((seg, i) => (
          <Box
            key={i}
            marginBottom={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={3}
          >
            <Slider
              value={[seg.start, seg.end]}
              onChange={(_, vals) => updateSegment(i, vals)}
              valueLabelDisplay="auto"
              min={0}
              max={duration}
              step={0.1}
            />
            <Box display="flex">
              <Typography>
                {seg.start.toFixed(1)}s – {seg.end.toFixed(1)}s
              </Typography>
              <IconButton
                color="error"
                onClick={e => {
                  e.stopPropagation();
                  removeSegment(i);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
