'use client';

import { Box } from '@mui/material';

type Props = {
  videoUrl: string;
};
export const VideoPlayer = ({ videoUrl }: Props) => {
  console.log('Render <VideoPlayer>');

  return (
    <Box
      sx={{
        height: '100%',
      }}
    >
      {/* <iframe
        width="100%"
        height="100%"
        src={videoUrl}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      /> */}
      <video
        src={videoUrl}
        width="100%"
        height="100%"
        autoPlay
        muted
        playsInline
        controls={false}
      />
    </Box>
  );
};
