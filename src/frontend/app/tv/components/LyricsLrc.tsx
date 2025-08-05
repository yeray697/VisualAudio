"use client";
import styled from '@emotion/styled';
import { css } from '@mui/material';
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

  font-size: 3rem;
  text-align: center;
  ${({ active }) => css`
     color: ${active ? '#cecece' : '#666'};
   `}
  
`;
const log = console.log.bind(console);

export const LyricsLrc = ( { lyrics, position } : Props) => {

  const { signal, recoverAutoScrollImmediately } =
    useRecoverAutoScrollImmediately();
  return (
    <>
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
    </>
  );
};