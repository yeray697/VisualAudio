"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./FileSelector.module.css";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useConfig } from "../../providers/ConfigProvider";
import { getAlbumFileUrl } from "../../../utils/albumFileUtils";

interface Props {
  albumId: string
  songId?: string
  value: File | string | null;  // Puede ser un File o un string (URL)
  onChange: (file: File | null) => void;
}

function isValidUrl(str: string | null): boolean {
  if (!str)
    return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}


export default function FileSelector({ value, albumId, songId, onChange }: Props) {
  const config = useConfig();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (typeof value === "string") {
      if (isValidUrl(value))
        setPreview(value);
      else
        setPreview(getAlbumFileUrl(config.apiUrl, value, albumId, songId ))
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

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={styles.albumCoverInput}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {preview ? (
        <div className={styles.imageWrapper}>
          <img
            src={preview}
            alt="Album cover"
          />
          {/* Overlay en hover */}
          <div className={styles.overlay}>
            <button
              type="button"
              onClick={openFileSelector}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              onClick={handleRemove}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      ) : (
        // Si NO hay imagen
        <div
          className={styles.placeholder}
          onClick={openFileSelector}
        >
          <AddIcon/>
        </div>
      )}
    </div>
  );
}