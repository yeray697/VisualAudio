'use client';

import { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import AudioVisualizerClient from './AudioVisualizerClient';
import { Box, Grid, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { IconButton } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useConfig } from '../../providers/ConfigProvider';
import { getAlbumFileUrl } from '../../../utils/albumFileUtils';
import { VisuallyHiddenInput } from './ImageSelector';
import { SongFingerprintContent } from '../../../types/album-form';

interface Props {
  value?: SongFingerprintContent;
  height: number;
  padding: number;
  border: number;
  onChange: (file: File | null) => void;
}

export default function AudioSelector({
  value,
  height,
  padding,
  border,
  onChange,
}: Props) {
  const config = useConfig();
  const [preview, setPreview] = useState<string | null>(null);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (value.file?.modified) {
      if (!value.file.content) {
        // user deleted from ui
        setPreview(null);
        return;
      }

      if (typeof value.file.content === 'string') {
        setPreview(getAlbumFileUrl(config.apiUrl, value.file.content));
        return;
      }

      if (value.file.content) {
        const url = URL.createObjectURL(value.file.content as File);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    }

    if (value.filename) {
      setPreview(getAlbumFileUrl(config.apiUrl, value.filename));
      return;
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files?.[0] || null;
    onChange(file);
  };

  return (
    <Grid
      container
      sx={{ padding: padding }}
      border={`${border}px solid #333`}
      borderRadius="25px"
      justifyContent="center"
    >
      {!preview ? (
        <Box display="flex">
          <IconButton
            style={{ height: height }}
            component="label"
            role={undefined}
            tabIndex={-1}
          >
            <CloudUploadIcon />
            <VisuallyHiddenInput
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              multiple
            />
          </IconButton>
          <Typography alignContent="center">
            Upload file to generate fingerprint
          </Typography>
        </Box>
      ) : (
        <>
          <Grid size={{ xs: 1 }}>
            <IconButton
              onClick={e => {
                e.stopPropagation();
                setPlaying(!isPlaying);
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Grid>
          <Grid size={{ xs: 9 }}>
            <AudioVisualizerClient
              audioUrl={preview}
              play={isPlaying}
              height={height}
            />
          </Grid>
          <Grid size={{ xs: 1 }}>
            <IconButton component="label" role={undefined} tabIndex={-1}>
              <CloudUploadIcon />
              <VisuallyHiddenInput
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                multiple
              />
            </IconButton>
          </Grid>
          <Grid size={{ xs: 1 }}>
            <IconButton
              color="error"
              onClick={e => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </>
      )}
    </Grid>
  );
}
