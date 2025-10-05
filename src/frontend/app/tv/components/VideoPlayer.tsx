'use client';

import { useRef, useEffect } from 'react';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';

type Props = {
  videoUrl: string;
};
export const VideoPlayer = ({ videoUrl }: Props) => {
  const isListening = useNowPlayingStore(state => state.shouldListenNext);
  const isStopped = useNowPlayingStore(state => state.isStopped);
  const position = useNowPlayingStore(state => state.position);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Saltar al segundo correcto cuando cambia position
  useEffect(() => {
    if (videoRef.current && position !== undefined) {
      console.log('VideoPlayer: set currentTime =', position);
      videoRef.current.currentTime = position;
    }
  }, [position]);

  // Controlar reproducción según flags
  useEffect(() => {
    if (!videoRef.current) return;

    if (isStopped || isListening || position === undefined) {
      videoRef.current.pause();
      console.log('VideoPlayer: paused (stopped, listening or no position)');
    } else {
      videoRef.current.play().catch(err => {
        console.warn('VideoPlayer: autoplay failed', err);
      });
    }
  }, [isStopped, position]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      style={{ display: 'block' }}
      width="100%"
      height="100%"
      muted
      playsInline
      controls={false}
    />
  );
};
