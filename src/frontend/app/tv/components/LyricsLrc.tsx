"use client";
import styled from '@emotion/styled';
import { Box, css } from '@mui/material';
import { CSSProperties } from 'react';
import { Lrc, useRecoverAutoScrollImmediately } from 'react-lrc';

type Props = {
  lyrics: string,
  position: number | undefined,
}

const lrcStyle: CSSProperties = {
  height: '100%',
  padding: '5px 0',
  overflow: 'hidden'
};
const Line = styled.div<{ active: boolean }>`
  min-height: 10px;
  padding: 5px 20px;

  ${({ active }) => css`
     font-size: ${active ? 'clamp(2rem, 5vw, 3.2rem)' : 'clamp(1.8rem, 4vw, 3rem)'};
   `}
  ${({ active }) => css`
     font-weight: ${active ? '600' : '400'};
   `}
  ${({ active }) => css`
     scroll-margin-block: ${active ? '10px' : '0px'};
   `}
  text-align: center;
  ${({ active }) => css`
     color: ${active ? '#white' : '#888'};
   `}
  textShadow: "0 0 4px rgba(0,0,0,0.6)";
    transition: "all 0.3s ease",
  
`;
const log = console.log.bind(console);

export const LyricsLrc = ( { lyrics, position } : Props) => {

  const { signal } =
    useRecoverAutoScrollImmediately();
  return (
    <Box sx={{    position: 'relative',
    overflowY: 'auto',
    height: '100%',
    maskImage: 'linear-gradient(to bottom, transparent, black 50px, black calc(100% - 300px), transparent 100%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 100px, black calc(100% - 300px), transparent 100%)',
}}>
      <Lrc
        lrc={lyrics}
        lineRenderer={({ active, line: { content } }) => (
          <Line active={active}>{content}</Line>
        )}
        currentMillisecond={(position ?? 0) * 1000}
        verticalSpace={true}
        style={lrcStyle}
        recoverAutoScrollSingal={signal}
        recoverAutoScrollInterval={5000}
        onLineUpdate={log}
        onAutoScrollChange={log}
      />
    </Box>
  );
};