"use client";

import { Album, AlbumFormDto, mapAlbumToForm, mapSongsForm } from "../../../types/album";
import { useEffect } from "react";
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
import { useConfig } from "../../providers/ConfigProvider";
import { DeleteFileEntry, UploadFileEntry, useCreateOrUpdateAlbum, useDeleteAlbumFiles, useUploadAlbumFiles } from "../../hooks/useAlbumMutations";
import { useSearchMetadata } from "../../hooks/useAlbums";
import useAlbumAdminStore from "../../../store/adminAlbumForm";

interface Props {
  album?: Album | null;
  onClose: () => void;
}
export default function AlbumForm({ album, onClose }: Props) {
  const { id, albumImageFile, albumImageFilename, title, artist, songs, setAlbum, resetAlbum } = useAlbumAdminStore()

  const { fetch: saveAlbumApi } = useCreateOrUpdateAlbum({ id: album?.id || "", title, artist, songs }, false);
  const { fetch: uploadFilesApi } = useUploadAlbumFiles();
  const { fetch: deleteFilesApi } = useDeleteAlbumFiles();
  const { data: metadata, loading: metadataLoading, error: metadataError, fetch: metadataFetch } = useSearchMetadata(artist || "", title || "");
  
  useEffect(() => {
  if (album) {
      setAlbum(mapAlbumToForm(album));
    } else {
      resetAlbum();
    }
  }, [album]);

  const getMetadata = async () => {
    metadataFetch();
  }

  useEffect(() => {
    if (!metadata)
      return;
    if (metadata.albumImageFilename) {
      setAlbum({ albumImageFile: metadata.albumImageFilename })
    }
    setAlbum({ title: metadata.title, artist: metadata.artist, songs: mapSongsForm(metadata.songs) })
  }, [metadata]);

  const getFilesActions = () => {
    const uploadFiles : Array<UploadFileEntry> = [];
    const deleteFiles : Array<DeleteFileEntry> = [];

    if (albumImageFile && (albumImageFile instanceof File || albumImageFile !== albumImageFilename)) {
      uploadFiles.push({ file: albumImageFile, fileType: "AlbumImage" })
    } else if (!albumImageFile && albumImageFilename) {
      deleteFiles.push({ fileType: "AlbumImage" })
    }



    songs.forEach((song, i) => {
      if (song.songImageFile instanceof File) {
        uploadFiles.push({ file: song.songImageFile, fileType: "SongImage", songId: song.id })
      } else if (!song.songImageFile && song.songImageFilename) {
        deleteFiles.push({ fileType: "SongImage", songId: song.id })
      }


      if (song.songAudioFile instanceof File) {
        uploadFiles.push({ file: song.songAudioFile, fileType: "Song", songId: song.id })
      } else if (!song.songAudioFile && song.songFilename) {
        deleteFiles.push({ fileType: "Song", songId: song.id })
      }
    })

    return { uploadFiles, deleteFiles };
  }
  const saveAlbum = async () => {
    const savedAlbum = await saveAlbumApi();
    
    const { deleteFiles, uploadFiles } = getFilesActions();
    if (uploadFiles.length) await uploadFilesApi(savedAlbum.id, uploadFiles);
    if (deleteFiles.length) await deleteFilesApi(savedAlbum.id, deleteFiles);

    onClose();
  };

  return (
    <>
      <DialogTitle>{album ? "Edit Album" : "Create Album"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{padding: 2}}>
          <Grid size={{xs: 3 }}>
            <FileSelector
              value={albumImageFile}
              albumId={id}
              onChange={(file) => setAlbum({ albumImageFile: file })} 
            />
          </Grid>
          <Grid size={{xs: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Artist"
                  fullWidth
                  value={artist}
                  onChange={(e) => setAlbum( { artist: e.target.value })}
                />
              </Grid>
              <Grid size={{xs: 12 }}>
                <TextField
                  label="Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setAlbum( { title: e.target.value })}
                />
              </Grid>
              <IconButton onClick={() => getMetadata()}>
                <SearchIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid size={{xs: 12 }}>
            <Typography variant="h6">Songs</Typography>
            <AlbumFormSongList />
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
