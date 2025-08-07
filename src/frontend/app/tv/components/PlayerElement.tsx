"use client";

import { Box, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  children?: ReactNode
  sx?: SxProps<Theme>;
}
export const PlayerElement = ({ children, sx } : Props) => {
  
  return (
    <Box style={{}}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',

        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 4,
        padding: 4,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        ...sx, 
      }}
    >
     {children} 
    </Box>
  );
};