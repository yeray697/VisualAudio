"use client";
import styled from '@emotion/styled';
import { css } from '@mui/material';
import { CSSProperties } from 'react';
import { Lrc, useRecoverAutoScrollImmediately } from 'react-lrc';

type Props = {
  lyrics: string,
  position: number | undefined,
}

const Root = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  display: flex;
  flex-direction: column;

  > .lrc-box {
    position: relative;

    flex: 1;
    min-height: 0;

    &::before {
      content: '';
      width: 100%;
      height: 1px;

      position: absolute;
      top: 50%;
      left: 0;

      background: rgb(255 0 0 / 0.15);
    }
  }
`;
const lrcStyle: CSSProperties = {
  height: '100%',
  padding: '5px 0',
};
const Line = styled.div<{ active: boolean }>`
  min-height: 10px;
  padding: 5px 20px;

  font-size: 16px;
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