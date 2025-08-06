"use client";

import { useEffect, useState } from "react";
import { Album,  } from "../../types/album";
import AlbumForm from "./components/AlbumForm";

import {
  Typography,
  Button,
  CircularProgress,
  Dialog,
  Grid,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import AlbumsListItem from "./components/AlbumListItem";
import { useAlbums } from "../hooks/useAlbums";
import { useDeleteAlbum } from "../hooks/useAlbumMutations";

export default function AlbumsPage() {
  const { data : albums, loading: albumsLoading, fetch: fetchAlbums } = useAlbums();
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [openRemoveForm, setOpenRemoveForm] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const { fetch: deleteAlbum, loading: loadingDeleteAlbum } = useDeleteAlbum(albumToDelete?.id)
  
  const handleOpenEditForm = (album?: Album) => {
    setSelectedAlbum(album || null);
    setOpenEditForm(true);
  };

  const handleCloseEditForm = (saved: boolean) => {
    if (!openEditForm)
      return;
    setOpenEditForm(false);
    if (!saved)
      return;
    setSelectedAlbum(null);
    fetchAlbums();
  };

  const handleOpenRemoveForm = (album: Album) => {
    setAlbumToDelete(album)
    setOpenRemoveForm(true);
  }

  const handleCloseRemoveForm = () => {
    setAlbumToDelete(null);
    setOpenRemoveForm(false);
  };

  const handleConfirmDelete = async () => {
  if (!albumToDelete) return;
    await deleteAlbum();
    await fetchAlbums();
    handleCloseRemoveForm();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Albums
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenEditForm()}>
        Add Album
      </Button>

      {albumsLoading ? (
        <CircularProgress style={{ marginTop: "2rem" }} />
      ) : (
        <Grid container spacing={3} style={{ marginTop: "1rem" }}>
          {albums?.map((album) => (
            <Grid size={{xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }} key={album.id}>
              <AlbumsListItem
                key={album.id}
                album={album}
                onEditClicked={(editAlbum) => handleOpenEditForm(editAlbum)}
                onRemoveClicked={(removeAlbum) => handleOpenRemoveForm(removeAlbum) }
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openEditForm} onClose={handleCloseEditForm} maxWidth="md" fullWidth >
        <AlbumForm album={selectedAlbum} onClose={handleCloseEditForm} />
      </Dialog>
      <Dialog
        open={openRemoveForm}
        onClose={() => handleCloseRemoveForm()}
      >
        <DialogTitle>
          {"Are you sure?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            { `Album "${albumToDelete?.title}" will be deleted permanently`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseRemoveForm()}>Cancel</Button>
          <Button onClick={() => handleConfirmDelete()} autoFocus color="error" loading={loadingDeleteAlbum}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}