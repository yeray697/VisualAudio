'use client';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { CSSProperties } from 'react';
import { Lrc, useRecoverAutoScrollImmediately } from 'react-lrc';
import { useBlurhashContext } from './BlurhashProvider';
import { useNowPlayingStore } from '../../../store/nowPlayingStore';

type Props = {
  lyrics: string;
};

const lrcStyle: CSSProperties = {
  height: '100%',
  padding: '5px 0',
  overflow: 'hidden',
};

const Line = styled.div<{
  active: boolean;
  textColor: string;
  fadedColor: string;
  textShadow: string;
}>`
  min-height: 10px;
  padding: 5px 20px;
  text-align: center;
  scroll-margin-block: ${({ active }) => (active ? '10px' : '0px')};

  font-size: ${({ active }) =>
    active ? 'clamp(1.6rem, 2.5vw, 2.6rem)' : 'clamp(1.4rem, 2vw, 2.2rem)'};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active, textColor, fadedColor }) =>
    active ? textColor : fadedColor};
  text-shadow: ${({ textShadow }) => textShadow};

  transition: all 0.3s ease;
`;
const log = console.log.bind(console);

export const LyricsLrc = ({ lyrics }: Props) => {
  const position = useNowPlayingStore(state => state.position);

  const { textColor, dominantColor, fadedTextColor } = useBlurhashContext();
  const { signal } = useRecoverAutoScrollImmediately();

  const generateTextShadow = (color: string) => {
    // Si fondo oscuro, sombra clara, si fondo claro, sombra oscura y suave
    const luminance = (() => {
      // Convierte rgb(x,y,z) a luminancia rápida:
      const rgb = color.match(/\d+/g);
      if (!rgb) return 1;
      const [r, g, b] = rgb.map(Number);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luminance;
    })();

    if (luminance < 60) return '0 0 4px rgba(0, 0, 0, 0.6)';
    if (luminance < 128) return '0 0 4px rgba(0, 0, 0, 0.4)';
    if (luminance < 180) return '0 0 4px rgba(0, 0, 0, 0.2)';
    return '0 0 4px rgba(0, 0, 0, 0.1)';
  };

  const textShadow = generateTextShadow(dominantColor);
  return (
    <Box
      sx={{
        position: 'relative',
        overflowY: 'auto',
        height: '100%',
        maskImage:
          'linear-gradient(to bottom, transparent, black 50px, black calc(100% - 300px), transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, black 100px, black calc(100% - 300px), transparent 100%)',
      }}
    >
      <Lrc
        lrc={lyrics}
        lineRenderer={({ active, line: { content } }) => (
          <Line
            active={active}
            textColor={textColor}
            fadedColor={fadedTextColor}
            textShadow={textShadow}
          >
            {content}
          </Line>
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
