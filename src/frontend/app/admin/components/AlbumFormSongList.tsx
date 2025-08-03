"use client";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AlbumFormSongItem from "./AlbumFormSongItem";
import useAlbumAdminStore from "../../../store/adminAlbumForm";

export default function AlbumFormSongList() {
  
  const { songs, addSong } = useAlbumAdminStore()
  
  const handleAddSong = () => {
    addSong({
      id: crypto.randomUUID(),
      name: "",
      position: songs.length + 1,
      duration: 0,
      songAudioFile: null,
      songImageFile: null,
      songLyricsFileContent: null,
      durationMinutes: 0,
      durationSeconds: 0
    });
  };

  return (
    <>
      <Typography variant="h6">Songs</Typography>
      <Box>
        {songs.map((song, index) => (
          <AlbumFormSongItem
            key={song.id || index}
            index={index}
          />
        ))}
        <Box display='flex' justifyContent='flex-end'>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddSong}
            sx={{ mt: 1 }}
          >
            Add Song
          </Button>
        </Box>
      </Box>
    </>
  );
}
