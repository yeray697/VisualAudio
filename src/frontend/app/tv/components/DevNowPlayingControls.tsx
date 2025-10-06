import { Box, IconButton, Typography } from '@mui/material';
import { useAlbums } from '../../hooks/useAlbums';
import FileSelector from '../../admin/components/ImageSelector';
import { Album, Song } from '../../../types/album';
import { useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { NowPlaying } from '../../../types/message';
import { PlayerElement } from './PlayerElement';
import { QueueItem } from './QueueItem';

type Props = {
  onSelectedNowPlaying: (nowPlaying: NowPlaying) => void;
};
export const DevNowPlayingControls = ({
  onSelectedNowPlaying: onSelectedSong,
}: Props) => {
  const { data: albums } = useAlbums();
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const selectSong = (song: Song) => {
    const position = song.duration - 5;
    const nowPlaying: NowPlaying = {
      album: selectedAlbum!,
      confidence: 1,
      trackPosition: position,
      nowPlaying: song,
      updatedAt: new Date(Date.now()),
    };
    onSelectedSong(nowPlaying);
  };
  return (
    <PlayerElement
      sx={{
        zIndex: 5,
        position: 'absolute',
        height: 'auto',
        width: '400px',
      }}
    >
      <Typography variant="h5">Dev panel</Typography>
      {
        // If no album selected, show album list
        !selectedAlbum ? (
          albums?.map((album, _) => (
            <Box
              key={album.id}
              onClick={() => setSelectedAlbum(album)}
              display="flex"
              gap={2}
              padding={1}
              width="100%"
              color="#bbb"
              bgcolor="#333"
              border={1}
              borderColor="#666"
              borderRadius={5}
              sx={{
                userSelect: 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  background: '#555',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                },
                cursor: 'pointer',
              }}
            >
              <Box width="56px">
                <FileSelector
                  value={album.albumImageFilename ?? null}
                  readonly
                  onChange={() => {}}
                />
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="space-around"
              >
                <Typography>{album.title}</Typography>
                <Typography>{album.artist}</Typography>
              </Box>
            </Box>
          ))
        ) : (
          // Else show album details
          <Box display="flex" flexDirection="column">
            <Box display="flex">
              <IconButton
                component="label"
                role={undefined}
                tabIndex={-1}
                onClick={() => setSelectedAlbum(null)}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box width="56px">
                <FileSelector
                  value={selectedAlbum.albumImageFilename ?? null}
                  readonly
                  onChange={() => {}}
                />
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="space-around"
              >
                <Typography>{selectedAlbum.title}</Typography>
                <Typography>{selectedAlbum.artist}</Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              gap={2}
              padding={1}
              width="100%"
              height="100%"
            >
              {selectedAlbum.songs.map((song, _) => (
                <Box key={song.id} onClick={() => selectSong(song)}>
                  <QueueItem album={selectedAlbum} song={song} />
                </Box>
              ))}
            </Box>
          </Box>
        )
      }
    </PlayerElement>
  );
};
