import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

interface Props {
  open: boolean;
  songId: string;
  onClose: () => void;
}

function highlightText(text: string): string {
  const regex = /^\[\d{2}:\d{2}(?:\.\d{1,3})?\]/gm;
  const highlighted = text.replace(regex, (match) => `<span style="color:#4FC3F7">${match}</span>`);
  return highlighted.replace(/\n/g, '<br/>');

}
function saveSelection(containerEl: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(containerEl);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;
  return { start, end: start + range.toString().length };
}

function restoreSelection(containerEl: HTMLElement, savedSel: { start: number; end: number } | null) {
  if (!savedSel) return;
  let charIndex = 0;
  const range = document.createRange();
  range.setStart(containerEl, 0);
  range.collapse(true);

  const nodeStack: ChildNode[] = [containerEl];
  let node: ChildNode | undefined;
  let foundStart = false;
  let stop = false;

  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const textLength = (node as Text).length;
      if (!foundStart && charIndex + textLength >= savedSel.start) {
        range.setStart(node, savedSel.start - charIndex);
        foundStart = true;
      }
      if (foundStart && charIndex + textLength >= savedSel.end) {
        range.setEnd(node, savedSel.end - charIndex);
        stop = true;
      }
      charIndex += textLength;
    } else {
      let i = node.childNodes.length;
      while (i--) nodeStack.push(node.childNodes[i]);
    }
  }

  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export const LyricsEditorDialog = ({ songId, open, onClose }: Props) => {
  const { id: albumId, updateSong } = useAlbumAdminStore();
  const { data: lyricsData } = useGetAlbumFile(albumId, "SongLyrics", songId, open); // Auto fetch solo si open

  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Cargo letras solo cuando se abre el diálogo y lyricsData cambia
  useEffect(() => {
    if (open && lyricsData) {
      lyricsData.text().then((txt) => {
        setText(txt);
        setOriginalText(txt);
      });
    }
  }, [open, lyricsData]);

  // Actualizo HTML con resaltado manteniendo cursor solo si abierto y ref existe
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const saved = saveSelection(ref.current);
    ref.current.innerHTML = highlightText(text);
    restoreSelection(ref.current, saved);
  }, [text, open]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const plainText = e.currentTarget.textContent || "";
    setText(plainText);
  };

  const handleSave = () => {
    updateSong(songId, {
      songLyricsFileContent: { content: text, modified: originalText !== text },
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar letras</DialogTitle>
      <DialogContent>
        {open && (
          <Box
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            sx={{
              fontFamily: "monospace",
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: 2,
              minHeight: 300,
              outline: "none",
              whiteSpace: "pre-wrap",
              borderRadius: 1,
              overflow: "auto",
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={text === originalText}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
