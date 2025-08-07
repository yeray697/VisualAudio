"use client";

import { Box } from '@mui/material';

export const VideoPlayer = () => {

  return (
    <Box
      sx={{
        height:'100%'
      }}
    >
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/5mGuCdlCcNM?autoplay=1&mute=1"
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};