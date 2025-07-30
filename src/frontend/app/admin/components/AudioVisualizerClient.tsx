"use client";

import { useRef, useEffect } from "react";
import { useWavesurfer } from '@wavesurfer/react'


interface Props {
  audioUrl: string
  play: boolean
  height: number | "auto" | undefined
}

export default function AudioVisualizerClient({ height, audioUrl, play }: Props) {

  const containerRef = useRef(null)

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: height,
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
    url: audioUrl,
    // barWidth: 10,
    // barRadius: 10,
    // barGap: 2,
    // renderFunction: renderFunction
  })

  useEffect(() => { 
    if (!wavesurfer)
      return;
    play ? wavesurfer.play() : wavesurfer.pause() 
  }, [wavesurfer, play]);

  return <div ref={containerRef} />
}
