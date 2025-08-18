import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import useAlbumAdminStore from '../../../store/adminAlbumForm';
import { useGetAlbumFile } from '../../hooks/useAlbumMutations';
import Editor from 'react-simple-code-editor';
import { FileLike } from '../../../types/album-form';

interface Props {
  open: boolean;
  songId: string;
  existingLyrics?: FileLike;
  onClose: () => void;
}

const highlightText = (code: string) => {
  const timestampRegex = /^\[\d{2}:\d{2}(?:\.\d{1,3})?\]/gm;
  const commentRegex = /^(#.*)$/gm;

  return code
    .replace(
      timestampRegex,
      match => `<span style="color:#4FC3F7; font-weight:bold">${match}</span>`
    )
    .replace(
      commentRegex,
      match => `<span style="color:#9E9E9E; font-style:italic">${match}</span>`
    );
};

export const LyricsEditorDialog = ({
  songId,
  existingLyrics,
  open,
  onClose,
}: Props) => {
  const { id: albumId, updateSong } = useAlbumAdminStore();
  const { data: lyricsData } = useGetAlbumFile(
    albumId,
    'SongLyrics',
    songId,
    open && !!albumId && !!songId && !existingLyrics
  );

  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');

  useEffect(() => {
    if (open && (lyricsData || existingLyrics)) {
      if (lyricsData) {
        lyricsData.text().then(txt => {
          setText(txt);
          setOriginalText(txt);
        });
      } else {
        setText(existingLyrics as string);
        setOriginalText(existingLyrics as string);
      }
    }
  }, [open, existingLyrics, lyricsData]);

  const handleInput = (text: string) => {
    setText(text || '');
  };

  const handleSave = () => {
    updateSong(songId, {
      songLyricsFileContent: { content: text, modified: originalText !== text },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit lyrics</DialogTitle>
      <DialogContent>
        <Box
          style={{
            background: '#1e1e1e',
            borderRadius: 8,
            padding: 8,
            fontSize: 14,
            color: '#d4d4d4',
          }}
        >
          <Editor
            value={text}
            onValueChange={handleInput}
            highlight={highlightText}
            padding={10}
            style={{
              minHeight: 300,
              outline: 'none',
              whiteSpace: 'pre-wrap',
              fontFamily: '"Fira Code", monospace',
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={text === originalText}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
