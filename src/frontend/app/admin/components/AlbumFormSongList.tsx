"use client";
import { useEffect } from "react";
import { MetadataFileType, Song } from "../../../types/album";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AlbumFormSongItem from "./AlbumFormSongItem";

interface Props {
  albumId: string | undefined;
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  onSongFileChange: (songId: string, fileType: MetadataFileType, file: File) => void;
  onSongFileRemove: (songId: string, fileType: MetadataFileType) => void;
}
export default function AlbumFormSongList({ albumId, songs, setSongs, onSongFileChange, onSongFileRemove }: Props) {
  
  useEffect(() => {
    songs.sort((a, b) => a.position - b.position)
    setSongs(songs);
  }, [songs, setSongs]);
  
  const handleAddSong = () => {
    setSongs([
      ...songs,
      { id: crypto.randomUUID(), name: "", position: songs.length + 1, duration: 0 },
    ]);
  };

  const handleRemoveSong = (id: string) => {
    setSongs(songs.filter((s) => s.id !== id));
  };

  const handleUpdateSong = (id: string, field: keyof Song, value: string | number) => {
    const updated = songs.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSongs(updated);
  };

  const moveSong = (index: number, direction: "up" | "down") => {
    const newSongs = [...songs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Verificamos límites
    if (targetIndex < 0 || targetIndex >= newSongs.length) return;

    // Intercambiamos las posiciones en el array
    [newSongs[index], newSongs[targetIndex]] = [newSongs[targetIndex], newSongs[index]];

    // Actualizamos las posiciones (1..N)
    const updated = newSongs.map((song, i) => ({
      ...song,
      position: i + 1,
    }));

    setSongs(updated);
  };

  return (
    <div>
      {songs.map((song) => (
        <AlbumFormSongItem
          key={song.id}
          song={song}
          deleteSong={handleRemoveSong}
          moveSong={moveSong}
          updateSong={handleUpdateSong}
          songsLength={songs.length}
          albumId={albumId}
          onFileChange={onSongFileChange}
          onFileRemove={onSongFileRemove}
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
