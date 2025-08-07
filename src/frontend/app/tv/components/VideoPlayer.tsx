"use client";

import { Box } from '@mui/material';

export const VideoPlayer = () => {

  return (
    <Box
      sx={{
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 3,
      }}
    >
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/5mGuCdlCcNM"
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </Box>
  );
};