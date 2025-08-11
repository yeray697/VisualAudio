"use client";

import { useNowPlayingStore } from '../../../store/nowPlayingStore';
import { LinearProgress, Typography } from '@mui/material';
import { useBlurhashContext } from './BlurhashProvider';
import { formatDurationToTimeString } from '../../../utils/timeUtils';

type Props = {
  duration: number
}
export const MusicProgressBar = ({ duration }: Props) => {
  console.log("Render <MusicProgressBar>");
  const position = useNowPlayingStore(state => state.position);
  const positionStr = position ? formatDurationToTimeString(position) : "";
  const durationStr = formatDurationToTimeString(duration);
  const positionDisplay = `${positionStr} / ${durationStr}`;

  const { textColor } = useBlurhashContext();

  return (
    <>
      {
        position &&
        <>
          <LinearProgress
            sx={{
              width: '100%',
              height: '5px',
              borderRadius: 1,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: textColor,
                transition: 'background-color 0.3s ease',
              },
            }}
            variant="determinate" value={position * 100 / duration}
          />
          <Typography variant='subtitle2'>{positionDisplay}</Typography>
        </>
      }
    </>
  );
};