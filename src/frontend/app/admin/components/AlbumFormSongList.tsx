"use client";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AlbumFormSongItem from "./AlbumFormSongItem";
import useAlbumAdminStore from "../../../store/adminAlbumForm";

export default function AlbumFormSongList() {
  
  const { songs, addSong } = useAlbumAdminStore()
  
  const handleAddSong = () => {
    addSong({ id: crypto.randomUUID(), name: "", position: songs.length + 1, duration: 0, songAudioFile: null, songImageFile: null  });
  };

  return (
    <div>
      {songs.map((song, index) => (
        <AlbumFormSongItem
          key={song.id || index}
          index={index}
        />
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={handleAddSong}
        sx={{ mt: 1 }}
      >
        Add Song
      </Button>
    </div>
  );
}
