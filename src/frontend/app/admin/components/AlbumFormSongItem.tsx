"use client";

import {
  TextField,
  Grid,
  IconButton,
  Collapse,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useState } from "react";
import FileSelector from "./FileSelector";
import AudioSelector from "./AudioSelector";
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { getAlbumFileUrl } from "../../../utils/albumFileUtils";
import { useConfig } from "../../providers/ConfigProvider";
import useAlbumAdminStore from "../../../store/adminAlbumForm";
import { MetadataFileType } from "../../../types/album";

interface Props {
  index: number
}
export default function AlbumFormSongItem({ index }: Props) {
  const { id: albumId, updateSong, removeSong, moveSong } = useAlbumAdminStore()
  const song = useAlbumAdminStore((state) => state.songs[index]);
  const songsLength = useAlbumAdminStore((state) => state.songs.length);

  const config = useConfig();
  const [expanded, setExpanded] = useState(false);
  
  // const [songImage, setSongImage] = useState<File | string | null>(song ? getAlbumFileUrl(config.apiUrl, song.songImageFilename, albumId, song.id) : null);
  // const [songAudio, setSongAudio] = useState<File | string | null>(song ? getAlbumFileUrl(config.apiUrl, song.songFilename, albumId!, song.id) : null);



  return (

    <Paper sx={{ mb: 1, p: 1 }}>
      {/* Vista compacta */}
      <Grid container alignItems="center" onClick={() => setExpanded(!expanded)} sx={{ cursor: "pointer" }}>
        <Grid size={{xs: 8 }}>
          <Typography variant="body1">
            {song.position}. {song.name || <i>(Sin nombre)</i>}
          </Typography>
          <FingerprintIcon
            color={(
              typeof song.songAudioFile === "string") ? // If audio is already stored
                song.fingerprintId ? "success" : "error"
              : "disabled"
            }
          />
        </Grid>
        <Grid size={{xs: 2 }}>
          <Typography variant="body1">{song.duration} s</Typography>
        </Grid>
        <Grid size={{xs: 2 }}>
          <IconButton onClick={() => moveSong(song.position - 1, "up")} disabled={song.position === 1}>
            <ArrowDropUpIcon />
          </IconButton>
          <IconButton onClick={() => moveSong(song.position - 1, "down")} disabled={song.position === songsLength }>
            <ArrowDropDownIcon />
          </IconButton>
          <IconButton color="error" onClick={() => removeSong(index)}>
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Editor desplegable */}
      <Collapse in={expanded}>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid size={{xs: 3 }}>
            <FileSelector
              value={song.songImageFile}
              albumId={albumId}
              songId={song.id}
              onChange={(file) => updateSong(index, { songImageFile: file })} />
          </Grid>
          <Grid size={{xs: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{xs: 8 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={song.name}
                  onChange={(e) => updateSong(index, { name: e.target.value })}
                />
              </Grid>
              <Grid size={{xs: 4 }}>
                <TextField
                  label="Duration (s)"
                  type="number"
                  fullWidth
                  value={song.duration}
                  onChange={(e) => updateSong(index, { duration: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <Grid size={{xs: 12 }}>
              <AudioSelector
                value={song.songAudioFile} 
                albumId={albumId}
                songId={song.id}
                onChange={(file) => updateSong(index, { songAudioFile: file })} />
            </Grid>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
}