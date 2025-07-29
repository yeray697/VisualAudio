"use client";

import { useRef, useEffect, useCallback } from "react";
import { useWavesurfer } from '@wavesurfer/react'


interface Props {
  audioUrl: string
  play: boolean
  height: number | "auto" | undefined
}

export default function AudioVisualizerClient({ height, audioUrl, play }: Props) {

  const containerRef = useRef(null)

  const renderFunction = useCallback((peaks: Array<Float32Array | number[]>, ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas
    const scale = peaks[0].length / width
    const step = 10

    ctx.translate(0, height / 2)
    ctx.strokeStyle = ctx.fillStyle
    ctx.beginPath()

    for (let i = 0; i < width; i += step * 2) {
      const index = Math.floor(i * scale)
      const value = Math.abs(peaks[0][index])
      let x = i
      let y = value * height

      ctx.moveTo(x, 0)
      ctx.lineTo(x, y)
      ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, true)
      ctx.lineTo(x + step, 0)

      x = x + step
      y = -y
      ctx.moveTo(x, 0)
      ctx.lineTo(x, y)
      ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, false)
      ctx.lineTo(x + step, 0)
    }

    ctx.stroke()
    ctx.closePath()
  }, [])
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
