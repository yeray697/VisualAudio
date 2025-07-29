"use client";

import { useEffect, useState } from "react";
import DeleteIcon from '@mui/icons-material/Delete';
import AudioVisualizerClient from "./AudioVisualizerClient";
import { Grid, styled } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { IconButton } from "@mui/material";
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const VisuallyHiddenInput = styled('input')({
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

interface Props {
  value: File | string | null;
  onChange: (file: File | null) => void;
}

export default function AudioSelector({ value, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (typeof value === "string") {
      setPreview(value);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <>
    {
      !preview ? (
        <IconButton
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
      )
      : (
        <Grid container sx={{padding: 1}} border="1px solid #333" borderRadius="25px">
          <Grid size={{xs: 1 }}>
            <IconButton onClick={() => setPlaying(!isPlaying)}>
              {
                isPlaying ? <PauseIcon/> : <PlayArrowIcon />
              }
            </IconButton>
          </Grid>
          <Grid size={{xs: 9 }}>
            <AudioVisualizerClient
              audioUrl={preview}
              play={isPlaying}
              height={40}
            />
          </Grid>
          <Grid size={{xs: 1 }}>
            <IconButton
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
          </Grid>
          <Grid size={{xs: 1 }}>
            <IconButton color="error" onClick={handleRemove}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      )
    }
  </>
  );
}
