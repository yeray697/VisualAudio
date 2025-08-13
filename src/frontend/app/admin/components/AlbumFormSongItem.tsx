'use client';

import {
  TextField,
  IconButton,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useState } from 'react';
import FileSelector from './ImageSelector';
import AudioSelector from './AudioSelector';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import useAlbumAdminStore from '../../../store/adminAlbumForm';
import { motion } from 'motion/react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useShallow } from 'zustand/shallow';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import {
  formatDurationToTimeString,
  formatTimeToDuration,
} from '../../../utils/timeUtils';
import { LyricsEditorDialog } from './LyricsEditor';
import LyricsOutlinedIcon from '@mui/icons-material/LyricsOutlined';
import AlbumVideoSelector from './VideoEditor/AlbumVideoSelector';

interface Props {
  index: number;
}
export default function AlbumFormSongItem({ index }: Props) {
  const {
    id: albumId,
    updateSong,
    removeSong,
    moveSong,
  } = useAlbumAdminStore();
  const song = useAlbumAdminStore(useShallow(state => state.songs[index]));
  const songsLength = useAlbumAdminStore(
    useShallow(state => state.songs.length)
  );
  const [openVideoEditorDialog, setOpenVideoEditorDialog] =
    useState<boolean>(false);

  const [expanded, setExpanded] = useState(false);
  const [openLyricsDialog, setOpenLyricsDialog] = useState(false);

  const size = expanded ? 128 : 64;
  const audioSelectorPadding = 1;
  const audioSelectorHeight = 40;
  const audioSelectorBorder = 1;

  // height + 1*8px margin + 2*8px padding + 2*1px border
  const audioSelectorExpandedHeight =
    audioSelectorHeight +
    3 * (audioSelectorPadding * 8) +
    (2 + audioSelectorBorder);
  return (
    <>
      <motion.div
        layout
        initial={{ borderRadius: 8 }}
        style={{ marginBottom: 8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Paper sx={{ mb: 1, p: 3, borderRadius: 5 }} variant="outlined">
          <Box
            display="flex"
            alignItems="center"
            onClick={() => {
              setExpanded(!expanded);
            }}
            gap={2}
            sx={{ cursor: 'pointer' }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>{song.position}</Typography>

              <motion.div
                layout
                animate={{ width: size, height: size }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <FileSelector
                  value={song.songImageFile}
                  albumId={albumId}
                  songId={song.id}
                  onChange={file =>
                    updateSong(song.id, { songImageFile: file })
                  }
                  readonly={!expanded}
                />
              </motion.div>

              <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
                <PlayArrowIcon fontSize="small" />
              </motion.div>
            </Box>

            <Box flex={1} display="flex" gap={1} flexDirection="column">
              <Box display="flex" gap={1} flex={1}>
                {/* Name and artist */}
                <Box flex={1} display="flex" gap={1} flexDirection="column">
                  <motion.div layoutId={`song-name-${song.id}`}>
                    {expanded ? (
                      <TextField
                        label="Name"
                        fullWidth
                        value={song.name}
                        onClick={e => e.stopPropagation()}
                        onChange={e =>
                          updateSong(song.id, { name: e.target.value })
                        }
                      />
                    ) : (
                      <Typography variant="body1">
                        {song.name || <i>(Sin nombre)</i>}
                      </Typography>
                    )}
                  </motion.div>
                  <motion.div layoutId={`song-artist-${song.id}`}>
                    {expanded ? (
                      <TextField
                        label="Artist"
                        fullWidth
                        value={song.artist}
                        onClick={e => e.stopPropagation()}
                        onChange={e =>
                          updateSong(song.id, { artist: e.target.value })
                        }
                      />
                    ) : (
                      <Typography variant="body2">
                        {song.artist || <i>(Sin artista)</i>}
                      </Typography>
                    )}
                  </motion.div>
                </Box>

                {/* Duration and actions */}
                <Box display="flex" alignItems="stretch" gap={0.5}>
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{
                      display: 'flex',
                      gap: expanded ? 8 : 34,
                      alignItems: !expanded ? 'center' : 'flex-end',
                      flexDirection: expanded ? 'column-reverse' : 'row',
                      width: '100%',
                    }}
                  >
                    {/* Duration */}
                    <motion.div
                      layoutId={`song-duration-${song.id}`}
                      style={{ width: expanded ? '100%' : 'auto' }}
                    >
                      {expanded ? (
                        <Box onClick={e => e.stopPropagation()}>
                          <TimePicker
                            views={['minutes', 'seconds']}
                            format="mm:ss"
                            value={dayjs(
                              `${song.durationMinutes}:${song.durationSeconds}`,
                              'mm:ss'
                            )}
                            onChange={e => {
                              if (!e) return;
                              const minutes = e.minute();
                              const seconds = e.second();
                              updateSong(song.id, {
                                duration: formatTimeToDuration(
                                  minutes,
                                  seconds
                                ),
                                durationMinutes: minutes,
                                durationSeconds: seconds,
                              });
                            }}
                          />
                        </Box>
                      ) : (
                        <Typography>
                          {formatDurationToTimeString(song.duration)}
                        </Typography>
                      )}
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                      layout
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <FingerprintIcon
                        color={
                          typeof song.songAudioFile === 'string' // If audio is already stored
                            ? song.fingerprintId
                              ? 'success'
                              : 'error'
                            : 'disabled'
                        }
                      />
                      <LyricsOutlinedIcon
                        color={
                          !!song.songLyricsFileContent?.content ||
                          (!!song.songLyricsFilename &&
                            !song.songLyricsFileContent?.modified)
                            ? 'success'
                            : 'error'
                        }
                      />
                      <IconButton
                        onClick={e => {
                          e.stopPropagation();
                          moveSong(song.position - 1, 'up');
                        }}
                        disabled={song.position === 1}
                      >
                        <ArrowDropUpIcon />
                      </IconButton>
                      <IconButton
                        onClick={e => {
                          e.stopPropagation();
                          moveSong(song.position - 1, 'down');
                        }}
                        disabled={song.position === songsLength}
                      >
                        <ArrowDropDownIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          removeSong(song.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </motion.div>
                  </motion.div>
                </Box>
              </Box>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: expanded ? audioSelectorExpandedHeight : 0,
                  opacity: expanded ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ overflow: 'hidden' }}
              >
                <Grid
                  container
                  mt={1}
                  style={{
                    overflow: 'hidden',
                    transition: 'height 0.3s ease',
                  }}
                >
                  <Grid size={{ xs: 6 }}>
                    <AudioSelector
                      value={song.songAudioFile}
                      albumId={albumId}
                      songId={song.id}
                      height={audioSelectorHeight}
                      border={audioSelectorBorder}
                      padding={audioSelectorPadding}
                      onChange={file =>
                        updateSong(song.id, { songAudioFile: file })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        setOpenVideoEditorDialog(true);
                      }}
                    >
                      Video
                    </Button>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                        setOpenLyricsDialog(true);
                      }}
                    >
                      Lyrics
                    </Button>
                  </Grid>
                  <Box onClick={e => e.stopPropagation()}>
                    <LyricsEditorDialog
                      open={openLyricsDialog}
                      onClose={() => {
                        setOpenLyricsDialog(false);
                      }}
                      songId={song.id}
                      existingLyrics={song.songLyricsFileContent?.content}
                    />
                  </Box>
                </Grid>
              </motion.div>
            </Box>
          </Box>
        </Paper>
      </motion.div>
      <AlbumVideoSelector
        onClose={() => {
          setOpenVideoEditorDialog(false);
        }}
        albumId={albumId}
        songId={song.id}
        songDuration={song.duration}
        existingVideo={song.songVideoFilename}
        open={!!openVideoEditorDialog}
      />
    </>
  );
}
