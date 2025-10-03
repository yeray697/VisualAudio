'use client';

import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import { useBlurhashContext } from './BlurhashProvider';

type Props = {
  children?: ReactNode;
  sx?: SxProps<Theme>;
};
export const PlayerElement = ({ children, sx }: Props) => {
  const { textColor, overlayColor, dominantColor } = useBlurhashContext();

  return (
    <Box
      style={{}}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',

        backdropFilter: 'blur(12px)',
        backgroundColor: overlayColor,
        borderRadius: 4,
        padding: 4,
        // border: "1px solid rgba(255, 255, 255, 0.2)",
        // border: `1px solid ${textColor === "#fff" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
        border: `1px solid ${dominantColor}`,
        color: textColor,
        // boxShadow: `0 0 5px ${dominantColor}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
