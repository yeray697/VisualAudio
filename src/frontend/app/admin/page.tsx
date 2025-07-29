"use client";

import { useEffect, useState } from "react";
import { Album,  } from "../../types/album";
import AlbumForm from "./components/AlbumForm";
import { getAlbums } from "../api/albums";

import {
  Typography,
  Button,
  CircularProgress,
  Dialog,
  Grid,
} from "@mui/material";
import AlbumsListItem from "./components/AlbumListItem";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await getAlbums();
      setAlbums(data);
    } catch (error) {
      console.error("Error fetching albums", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAlbums();
  }, []);


  const handleOpenForm = (album?: Album) => {
    setSelectedAlbum(album || null);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedAlbum(null);
    fetchAlbums();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Albums
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
        Add Album
      </Button>

      {loading ? (
        <CircularProgress style={{ marginTop: "2rem" }} />
      ) : (
        <Grid container spacing={3} style={{ marginTop: "1rem" }}>
          {albums.map((album) => (
            <AlbumsListItem album={album} key={album.id} onEditClicked={(editAlbum) => handleOpenForm(editAlbum)} />
          ))}
        </Grid>
      )}

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <AlbumForm album={selectedAlbum} onClose={handleCloseForm} />
      </Dialog>
    </div>
  );
}