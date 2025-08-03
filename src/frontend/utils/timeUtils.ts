
export const formatDurationToTime = (duration: number) => {
  return {
    minutes: Math.round(Math.floor(duration / 60)),
    seconds: Math.round(duration % 60)
  }
}

export const formatDurationToTimeString = (duration: number) => {
  const { minutes, seconds } = formatDurationToTime(duration);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export const formatTimeToDuration = (minutes: number, seconds: number) => {
  return minutes * 60 + seconds;
}