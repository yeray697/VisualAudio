"use client";

import { Album, mapAlbumToForm, mapSongsForm } from "../../../types/album";
import { useEffect, useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
} from "@mui/material";
import FileSelector from "./ImageSelector";
import AlbumFormSongList from "./AlbumFormSongList";
import SearchIcon from "@mui/icons-material/Search";
import { DeleteFileEntry, UploadFileEntry, useCreateOrUpdateAlbum, useDeleteAlbumFiles, useUploadAlbumFiles } from "../../hooks/useAlbumMutations";
import { useSearchMetadata } from "../../hooks/useAlbums";
import useAlbumAdminStore from "../../../store/adminAlbumForm";

interface Props {
  album?: Album | null;
  onClose: (saved: boolean) => void;
}
export default function AlbumForm({ album, onClose }: Props) {
  const { id, albumImageFile, albumImageFilename, title, artist, songs, setAlbum, resetAlbum } = useAlbumAdminStore()

  const { fetch: saveAlbumApi, data: saveData, loading: saveLoading, error: apiSaveError } = useCreateOrUpdateAlbum({ id: album?.id || "", title, artist, songs }, false);
  const { fetch: uploadFilesApi, data: uploadFilesData, loading: uploadFilesLoading, error: uploadFilesError } = useUploadAlbumFiles();
  const { fetch: deleteFilesApi, data: deleteFilesData, loading: deleteFilesLoading, error: deleteFilesError } = useDeleteAlbumFiles();
  const { data: metadata, loading: metadataLoading, error: metadataError, fetch: metadataFetch } = useSearchMetadata(artist || "", title || "");
  const [ saveError, setSaveError ] = useState<string | null>();
  
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



    songs.forEach((song) => {
      if (song.songImageFile instanceof File) {
        uploadFiles.push({ file: song.songImageFile, fileType: "SongImage", songId: song.id })
      } else if (!song.songImageFile && song.songImageFilename) {
        deleteFiles.push({ fileType: "SongImage", songId: song.id })
      }

      if (song.songLyricsFileContent?.modified && song.songLyricsFileContent?.content) {
        const lyricsFileContent = new Blob([song.songLyricsFileContent.content], {
          type: 'text/plain'
        });
        uploadFiles.push({ file: lyricsFileContent, fileType: "SongLyrics", songId: song.id })
      } else if (song.songLyricsFileContent?.modified && !song.songLyricsFileContent?.content && song.songLyricsFilename) {
        deleteFiles.push({ fileType: "SongLyrics", songId: song.id })
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
    setSaveError(null)
    const savedAlbum = await saveAlbumApi();
    
    const { deleteFiles, uploadFiles } = getFilesActions();
    if (uploadFiles.length) await uploadFilesApi(savedAlbum.id, uploadFiles);
    if (deleteFiles.length) await deleteFilesApi(savedAlbum.id, deleteFiles);
  };

  useEffect(() => {
    if (saveLoading || uploadFilesLoading || deleteFilesLoading)
      return;
    if (apiSaveError)
      setSaveError(apiSaveError.message);
    else if (uploadFilesError)
      setSaveError(uploadFilesError.message);
    else if (deleteFilesError)
      setSaveError(deleteFilesError.message);
    else if (saveData)
      onClose(true)

  }, [saveLoading, apiSaveError, saveData, uploadFilesLoading, uploadFilesError, uploadFilesData, deleteFilesLoading, deleteFilesError, deleteFilesData, onClose])

  return (
    <>
      <DialogTitle>{album ? "Edit Album" : "Create Album"}</DialogTitle>
      <DialogContent >
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
              <Grid size={{xs: 12 }} display='flex' justifyContent='flex-end'>

                <Button
                  startIcon={<SearchIcon />}
                  onClick={getMetadata}
                  sx={{ mt: 1 }}
                  color={metadataError ? "error" : "info"}
                  loading={metadataLoading}
                >
                  Auto fill
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{xs: 12 }}>
            <AlbumFormSongList />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        { saveError && <Typography color="error">An error occurred saving the album: {saveError}</Typography> }
        { metadataError && !saveError && <Typography color="error">An error occurred searching for metadata: {metadataError.message}</Typography> }
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={saveAlbum} variant="contained" color="primary" loading={ saveLoading || uploadFilesLoading || deleteFilesLoading }>
          Save
        </Button>
      </DialogActions>
    </>
  );
}
