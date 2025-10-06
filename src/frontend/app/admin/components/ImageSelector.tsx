'use client';

import { useEffect, useRef, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useConfig } from '../../providers/ConfigProvider';
import { getAlbumFileUrl } from '../../../utils/albumFileUtils';
import { Box, CardMedia, IconButton, styled } from '@mui/material';

interface Props {
  readonly?: boolean;
  value: File | string | null; // Puede ser un File o un string (URL)
  onChange: (file: File | null) => void;
}

function isValidUrl(str: string | null): boolean {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
export const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function FileSelector({ value, readonly, onChange }: Props) {
  const config = useConfig();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (typeof value === 'string') {
      if (isValidUrl(value)) setPreview(value);
      else setPreview(getAlbumFileUrl(config.apiUrl, value));
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files?.[0] || null;
    onChange(file);
  };

  const openFileSelector = (e: React.MouseEvent) => {
    e.preventDefault();
    if (readonly) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Box
      position="relative"
      width="100%"
      height="100%"
      borderRadius={5}
      bgcolor="#f0f0f0"
      overflow="hidden"
      sx={{
        cursor: !readonly ? 'pointer' : undefined,
      }}
      onClick={e => {
        if (!readonly) e.stopPropagation();
      }}
    >
      <VisuallyHiddenInput
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        onClick={e => {
          e.stopPropagation();
          // resets the value in case the user selects a file, removes it, and select the same file again.
          // when value is not cleared and the same file is selected, the onChange event is not triggered
          // https://github.com/ngokevin/react-file-reader-input/issues/11#issuecomment-612959113
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        multiple
      />

      {preview ? (
        <Box
          position="relative"
          width="100%"
          height="100%"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <CardMedia
            component="img"
            width="100%"
            height="100%"
            sx={{ objectFit: 'cover' }}
            image={preview}
            onClick={e => {
              e.stopPropagation();
            }}
          />
          {/* Overlay en hover */}
          {!readonly && (
            <Box
              sx={{
                opacity: 0,
                '&:hover': {
                  opacity: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                transition:
                  'opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
              }}
              position="absolute"
              display="flex"
              gap={1}
              alignItems="center"
              justifyContent="center"
              onClick={e => e.stopPropagation()}
            >
              <IconButton type="button" onClick={openFileSelector}>
                <EditIcon />
              </IconButton>

              <IconButton onClick={handleRemove}>
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            color: '#bbb',
            backgroundColor: '#666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
            '&:hover': readonly
              ? {}
              : {
                  background: '#555',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
          }}
          onClick={openFileSelector}
        >
          {!readonly && <AddIcon fontSize="large" />}
        </Box>
      )}
    </Box>
  );
}
