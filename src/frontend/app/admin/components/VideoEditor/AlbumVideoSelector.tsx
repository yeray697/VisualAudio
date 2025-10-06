'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import AlbumVideoEditor from './AlbumVideoEditor';
import useAlbumAdminStore from '../../../../store/adminAlbumForm';
import { useShallow } from 'zustand/shallow';
import { useState } from 'react';
import { formatDurationToTimeString } from '../../../../utils/timeUtils';
import { getAlbumFileUrl } from '../../../../utils/albumFileUtils';
import { useConfig } from '../../../providers/ConfigProvider';
import { VideoContent } from '../../../../types/album-form';

interface Props {
  existingVideo?: VideoContent;
  songId: string;
  songDuration: number;
  open: boolean;
  onClose: () => void;
}
export default function AlbumVideoSelector({
  existingVideo,
  songId,
  songDuration,
  open,
  onClose,
}: Props) {
  const config = useConfig();
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const relatedVideos = useAlbumAdminStore(
    useShallow(state => state.relatedVideos)
  );
  const { updateSong } = useAlbumAdminStore();
  const handleCancel = () => {
    updateSong(songId, { songVideo: undefined });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>Edit video</DialogTitle>
      <DialogContent>
        <Box>
          <Box paddingBottom={2}>
            {relatedVideos?.map(v => (
              <Box
                key={v.uri}
                display="flex"
                borderRadius={5}
                border="1px"
                borderColor="red"
                alignItems="center"
                justifyContent="space-between"
                gap={12}
              >
                <Typography flex={1}>{v.title}</Typography>
                <Typography>
                  {formatDurationToTimeString(v.duration)}
                </Typography>
                <Button onClick={() => setVideoUrl(v.uri)}>Edit</Button>
              </Box>
            ))}
            <Typography paddingY={2}>or</Typography>
            <TextField
              label="Video URL"
              fullWidth
              value={videoUrl}
              onClick={e => e.stopPropagation()}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </Box>
          {(videoUrl || existingVideo) && (
            <AlbumVideoEditor
              songId={songId}
              songDuration={songDuration}
              videoUrl={
                !!videoUrl
                  ? videoUrl
                  : getAlbumFileUrl(config.apiUrl, existingVideo?.filename) ??
                    undefined
              }
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
