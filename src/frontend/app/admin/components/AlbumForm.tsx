"use client";

import { Album, MetadataFileType, Song } from "../../../types/album";
import { useEffect, useState } from "react";

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
  const config = useConfig();
  const [title, setTitle] = useState(album?.title || "");
  const [artist, setArtist] = useState(album?.artist || "");
  const [songs, setSongs] = useState<Song[]>(album?.songs || []);
  const { fetch: saveAlbumApi } = useCreateOrUpdateAlbum({ id: album?.id || "", title, artist, songs }, false);
  const { fetch: uploadFilesApi } = useUploadAlbumFiles();
  const { fetch: deleteFilesApi } = useDeleteAlbumFiles();
  const { data: metadata, loading: metadataLoading, error: metadataError, fetch: metadataFetch } = useSearchMetadata(album?.artist || "", album?.title || "");
  const [songFileActions, setSongFileActions] = useState<SongFileAction[]>([]);
  const [albumImage, setAlbumImage] = useState<File | string | null>(album ? getAlbumFileUrl(config.apiUrl, album.albumImageFilename, album.id) : null);

  const saveAlbum = async () => {
    const savedAlbum = await saveAlbumApi();

    const filesToUpload: UploadFileEntry[] = [];
    const filesToDelete: DeleteFileEntry[] = [];

    if (album?.albumImageFilename && !albumImage) {
      filesToDelete.push({ filetype: 'AlbumImage' });
    }
    if (albumImage instanceof File || isValidUrl(albumImage)) {
      filesToUpload.push({ file: (albumImage as File), filetype: 'AlbumImage' });
    }
    songFileActions.forEach(action => {
      if (action.action === 'Add') filesToUpload.push({ file: action.file!, filetype: action.fileType, songId: action.songId });
      if (action.action === 'Remove') filesToDelete.push({ filetype: action.fileType, songId: action.songId });
    });

    if (filesToUpload.length) await uploadFilesApi(savedAlbum.id, filesToUpload);
    if (filesToDelete.length) await deleteFilesApi(savedAlbum.id, filesToDelete);

    onClose();
  };

  const getMetadata = async () => {
    metadataFetch();
  }

  useEffect(() => {
    if (!metadata)
      return;
    if (metadata.albumImageFilename) {
      setAlbumImage(metadata.albumImageFilename);
    }
    setTitle(metadata.title);
    setArtist(metadata.artist);
    setSongs(metadata.songs);
  }, [metadata]);



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