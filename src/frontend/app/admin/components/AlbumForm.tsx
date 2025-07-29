"use client";

import { createOrUpdateAlbum, deleteAlbumFile, searchMetadata, uploadAlbumFile } from "../../api/albums";
import { Album, MetadataFileType, Song } from "../../../types/album";
import { useState } from "react";

import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
} from "@mui/material";
import FileSelector from "./FileSelector";
import AlbumFormSongList from "./AlbumFormSongList";
import SearchIcon from "@mui/icons-material/Search";
import { getAlbumFileUrl } from "../../../utils/albumFileUtils";

type SongFileAction = {
  songId: string;
  fileType: MetadataFileType
  action: "Remove" | "Add"
  file?: File
}
interface Props {
  album?: Album | null;
  onClose: () => void;
}
export default function AlbumForm({ album, onClose }: Props) {
  const [title, setTitle] = useState(album?.title || "");
  const [artist, setArtist] = useState(album?.artist || "");
  const [songs, setSongs] = useState<Song[]>(album?.songs || []);
  const [songFileActions, setSongFileActions] = useState<SongFileAction[]>([]);
  const [albumImage, setAlbumImage] = useState<File | string | null>(album ? getAlbumFileUrl(album.albumImageFilename, album.id) : null);

  const saveAlbum = async () => {
    const savedAlbum = await createOrUpdateAlbum({
      id: album?.id || "",
      title,
      artist,
      songs,
    });

    if (album?.albumImageFilename && !albumImage) {
      await deleteAlbumFile(savedAlbum.id, "AlbumImage");
    }
    if (albumImage instanceof File || isValidUrl(albumImage)) {
      await uploadAlbumFile(savedAlbum.id, albumImage!, "AlbumImage");
    }

    songFileActions.filter(s => s.action === "Add").forEach(async f => {
      await uploadAlbumFile(savedAlbum.id, f.file!, f.fileType, f.songId);
    });
    songFileActions.filter(s => s.action === "Remove").forEach(async f => {
      await deleteAlbumFile(savedAlbum.id, f.fileType, f.songId);
    });

    onClose();
  };

  const getMetadata = async () => {
    const albumTmp = await searchMetadata(artist, title);
    if (!albumTmp)
      return;
    if (albumTmp.albumImageFilename) {
      setAlbumImage(albumTmp.albumImageFilename);
    }
    setTitle(albumTmp.title);
    setArtist(albumTmp.artist);
    setSongs(albumTmp.songs);
  }

  const onSongFileChange = (songId: string, fileType: MetadataFileType, file: File) => {
    const newActions = songFileActions.filter(s => s.songId !== songId)
    newActions.push({ songId, action: "Add", fileType, file })
    setSongFileActions(newActions);
  }

  const onSongFileRemove = (songId: string, fileType: MetadataFileType) => {
    const newActions = songFileActions.filter(s => s.songId !== songId)
    newActions.push({ songId, action: "Remove", fileType })
    setSongFileActions(newActions);
  }

  return (
    <>
      <DialogTitle>{album ? "Edit Album" : "Create Album"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{padding: 2}}>
          <Grid size={{xs: 3 }}>
            <FileSelector value={albumImage} onChange={(file) => { setAlbumImage(file) }} />
          </Grid>
          <Grid size={{xs: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Artist"
                  fullWidth
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />
              </Grid>
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Grid>
              <IconButton onClick={() => getMetadata()}>
                <SearchIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid size={{xs: 12 }}>
            <Typography variant="h6">Songs</Typography>
            <AlbumFormSongList
              songs={songs}
              setSongs={setSongs}
              albumId={album?.id}
              onSongFileChange={onSongFileChange}
              onSongFileRemove={onSongFileRemove}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={saveAlbum} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </>
  );
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