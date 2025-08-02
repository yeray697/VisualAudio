"use client";

import {
  TextField,
  Grid,
  IconButton,
  Collapse,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useState } from "react";
import FileSelector from "./FileSelector";
import AudioSelector from "./AudioSelector";
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import useAlbumAdminStore from "../../../store/adminAlbumForm";
import { AnimatePresence, motion } from "motion/react";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface Props {
  index: number
}
export default function AlbumFormSongItem({ index }: Props) {
  const { id: albumId, updateSong, removeSong, moveSong } = useAlbumAdminStore()
  const song = useAlbumAdminStore((state) => state.songs[index]);
  const songsLength = useAlbumAdminStore((state) => state.songs.length);

  const [expanded, setExpanded] = useState(false);
  const [interactive, setInteractive] = useState(false);
  
  return (

    <Paper sx={{ mb: 1, p: 1 }}>
      {/* Vista compacta */}
      <Box
        display="flex"
        alignItems="center"
        onClick={() => {
          console.log("Expanding:", !expanded)
          setExpanded(!expanded)
          setInteractive(false);
        }}
        gap={2}
        sx={{ cursor: "pointer" }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography>{song.position}</Typography>

          <motion.div layout animate={{ width: expanded ? 128 : 64, height: expanded ? 128 : 64 }}
            style={{
              // overflow: "hidden",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onAnimationComplete={() => {
              console.log("Animation complete:", expanded)
              if (expanded) setInteractive(true);
            }}
          >
            <FileSelector
              value={song.songImageFile}
              albumId={albumId}
              songId={song.id}
              onChange={(file) =>
                updateSong(index, { songImageFile: file })
              }
              readonly={!interactive}
            />
          </motion.div>

          <IconButton size="small">
            <PlayArrowIcon />
          </IconButton>

        </Box>
        <Box
          flex={1}
          px={2}
          display="flex"
          flexDirection="column">
          <motion.div layoutId={`song-name-${index}`}>
            {!expanded ? (
              <Typography variant="body1">{song.name || <i>(Sin nombre)</i>}</Typography>
            ) : null }
          </motion.div>
          <motion.div layoutId={`song-artist-${index}`}>
            {!expanded ? (
              <Typography variant="body2">{song.artist || <i>(Sin artista)</i>}</Typography>
            ) : null }
          </motion.div>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>
          <motion.div layoutId={`song-duration-${index}`}>
            {!expanded ? (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {song.duration} s
              </motion.div>
            ) : null}
          </motion.div>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5}>

          <FingerprintIcon
            color={(
              typeof song.songAudioFile === "string") ? // If audio is already stored
                song.fingerprintId ? "success" : "error"
              : "disabled"
            }
          />
          
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              moveSong(song.position - 1, "up");
            }}
            disabled={song.position === 1}
          >
            <ArrowDropUpIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              moveSong(song.position - 1, "down");
            }}
            disabled={song.position === songsLength}
          >
            <ArrowDropDownIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              removeSong(index);
            }}
          >
            <DeleteIcon />
          </IconButton>

        </Box>
      </Box>

       <AnimatePresence>
        {expanded && (
          <motion.div
            key="editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <Grid container spacing={1} sx={{ mt: 1 }}>

              <Grid size={{xs: 9 }}>
                <Grid container spacing={2}>
                  <Grid size={{xs: 5 }}>
                    <motion.div layoutId={`song-name-${index}`}>
                      <TextField
                        label="Name"
                        fullWidth
                        value={song.name}
                        onChange={(e) =>
                          updateSong(index, { name: e.target.value })
                        }
                      />
                    </motion.div>
                  </Grid>
                  <Grid size={{xs: 4 }}>
                    <motion.div layoutId={`song-artist-${index}`}>
                      <TextField
                        label="Artist"
                        fullWidth
                        value={song.artist}
                        onChange={(e) =>
                          updateSong(index, { artist: e.target.value })
                        }
                      />
                    </motion.div>
                  </Grid>
                  <Grid size={{xs: 3 }}>
                    <motion.div layoutId={`song-duration-${index}`}>
                      <TextField
                        label="Duration (s)"
                        type="number"
                        fullWidth
                        value={song.duration}
                        onChange={(e) =>
                          updateSong(index, {
                            duration: Number(e.target.value),
                          })
                        }
                      />
                    </motion.div>
                  </Grid>
                </Grid>
                <Grid size={{xs: 12 }}>
                  <AudioSelector
                    value={song.songAudioFile}
                    albumId={albumId}
                    songId={song.id}
                    onChange={(file) =>
                      updateSong(index, { songAudioFile: file })
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
}