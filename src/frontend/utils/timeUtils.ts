export const formatDurationToTime = (duration: number) => {
  let minutes = Math.floor(duration / 60);
  let seconds = Math.floor(duration % 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return { minutes, seconds };
};

export const formatDurationToTimeString = (duration: number) => {
  const { minutes, seconds } = formatDurationToTime(duration);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatTimeToDuration = (minutes: number, seconds: number) => {
  return minutes * 60 + seconds;
};
