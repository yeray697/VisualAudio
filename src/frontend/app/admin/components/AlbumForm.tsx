'use client';

import { Album, albumTypes } from '../../../types/album';
import { useEffect, useState } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Select,
  MenuItem,
  Box,
  InputLabel,
  FormControl,
} from '@mui/material';
import FileSelector from './ImageSelector';
import AlbumFormSongList from './AlbumFormSongList';
import SearchIcon from '@mui/icons-material/Search';
import {
  DeleteFileEntry,
  UploadFileEntry,
  useCreateOrUpdateAlbum,
  useDeleteAlbumFiles,
  useUploadAlbumFiles,
} from '../../hooks/useAlbumMutations';
import { useSearchMetadata } from '../../hooks/useAlbums';
import useAlbumAdminStore from '../../../store/adminAlbumForm';
import { mapAlbumToForm, mapSongsForm } from '../../../types/album-form';
import {
  FingerprintJobPayload,
  usePostFingerprintJob,
  usePostVideoJob,
  VideoJobPayload,
} from '../../hooks/useJobs';

interface Props {
  album?: Album | null;
  onClose: (saved: boolean) => void;
}
export default function AlbumForm({ album, onClose }: Props) {
  const {
    id,
    albumImageFile,
    albumImageFilename,
    title,
    albumType,
    artist,
    songs,
    setAlbum,
    resetAlbum,
  } = useAlbumAdminStore();

  const {
    fetch: saveAlbumApi,
    data: saveData,
    loading: saveLoading,
    error: apiSaveError,
  } = useCreateOrUpdateAlbum(
    { id: album?.id || '', albumType, title, artist, songs },
    false
  );
  const {
    fetch: uploadFilesApi,
    data: uploadFilesData,
    loading: uploadFilesLoading,
    error: uploadFilesError,
  } = useUploadAlbumFiles();
  const {
    fetch: deleteFilesApi,
    data: deleteFilesData,
    loading: deleteFilesLoading,
    error: deleteFilesError,
  } = useDeleteAlbumFiles();
  const {
    fetch: postVideoJobsApi,
    data: postVideoJobsData,
    loading: postVideoJobsLoading,
    error: postVideoJobsError,
  } = usePostVideoJob();
  const {
    fetch: postFingerprintJobsApi,
    data: postFingerprintJobsData,
    loading: postFingerprintJobsLoading,
    error: postFingerprintJobsError,
  } = usePostFingerprintJob();
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
    fetch: metadataFetch,
  } = useSearchMetadata(artist || '', title || '');
  const [saveError, setSaveError] = useState<string | null>();

  useEffect(() => {
    if (album) {
      setAlbum(mapAlbumToForm(album));
    } else {
      resetAlbum();
    }
  }, [album]);

  const getMetadata = async () => {
    metadataFetch();
  };

  useEffect(() => {
    if (!metadata) return;
    if (metadata.albumImageFilename) {
      setAlbum({ albumImageFile: metadata.albumImageFilename });
    }
    setAlbum({
      title: metadata.title,
      artist: metadata.artist,
      songs: mapSongsForm(metadata.songs),
      relatedVideos: metadata.relatedVideos,
    });
  }, [metadata]);

  const getFilesActions = () => {
    const songFingerprints: Array<FingerprintJobPayload> = [];
    const downloadVideos: Array<VideoJobPayload> = [];
    const uploadFiles: Array<UploadFileEntry> = [];
    const deleteFiles: Array<DeleteFileEntry> = [];

    if (
      albumImageFile &&
      (albumImageFile instanceof File || albumImageFile !== albumImageFilename)
    ) {
      uploadFiles.push({ file: albumImageFile, fileType: 'AlbumImage' });
    } else if (!albumImageFile && albumImageFilename) {
      deleteFiles.push({ fileType: 'AlbumImage' });
    }

    songs.forEach(song => {
      if (song.songImageFile instanceof File) {
        uploadFiles.push({
          file: song.songImageFile,
          fileType: 'SongImage',
          songId: song.id,
        });
      } else if (song.songVideo?.videoUrl) {
        downloadVideos.push({
          albumId: id,
          songId: song.id,
          maxQuality: song.songVideo.maxQuality,
          videoUrl: song.songVideo.videoUrl,
          segments: song.songVideo.segments,
        });
      }
      if (!song.songImageFile && song.songImageFilename) {
        deleteFiles.push({ fileType: 'SongImage', songId: song.id });
      } else if (song.songVideo?.filename && song.songVideo?.videoUrl) {
        deleteFiles.push({ fileType: 'SongVideo', songId: song.id });
      }

      if (
        song.songLyricsFileContent?.modified &&
        song.songLyricsFileContent?.content
      ) {
        const lyricsFileContent = new Blob(
          [song.songLyricsFileContent.content],
          {
            type: 'text/plain',
          }
        );
        uploadFiles.push({
          file: lyricsFileContent,
          fileType: 'SongLyrics',
          songId: song.id,
        });
      } else if (
        song.songLyricsFileContent?.modified &&
        !song.songLyricsFileContent?.content &&
        song.songLyricsFilename
      ) {
        deleteFiles.push({ fileType: 'SongLyrics', songId: song.id });
      }

      if (
        song.songFingerprint?.file?.content instanceof File &&
        song.songFingerprint?.file?.modified
      ) {
        songFingerprints.push({
          albumId: id,
          songId: song.id,
          fileContent: song.songFingerprint.file.content,
        });
      } else if (
        song.songFingerprint?.filename &&
        !!song.songFingerprint?.file &&
        song.songFingerprint.file.modified
      ) {
        deleteFiles.push({ fileType: 'Song', songId: song.id });
      }
    });

    return { uploadFiles, deleteFiles, downloadVideos, songFingerprints };
  };

  const saveAlbum = async () => {
    setSaveError(null);
    const savedAlbum = await saveAlbumApi();

    const { deleteFiles, uploadFiles, downloadVideos, songFingerprints } =
      getFilesActions();
    if (uploadFiles.length) await uploadFilesApi(savedAlbum.id, uploadFiles);
    if (deleteFiles.length) await deleteFilesApi(savedAlbum.id, deleteFiles);
    if (downloadVideos.length) await postVideoJobsApi(downloadVideos);
    if (songFingerprints.length) await postFingerprintJobsApi(songFingerprints);
  };

  useEffect(() => {
    if (
      saveLoading ||
      uploadFilesLoading ||
      deleteFilesLoading ||
      postVideoJobsLoading ||
      postFingerprintJobsLoading
    )
      return;
    if (apiSaveError) setSaveError(apiSaveError.message);
    else if (uploadFilesError) setSaveError(uploadFilesError.message);
    else if (deleteFilesError) setSaveError(deleteFilesError.message);
    else if (postVideoJobsError) setSaveError(postVideoJobsError.message);
    else if (postFingerprintJobsError)
      setSaveError(postFingerprintJobsError.message);
    else if (saveData) onClose(true);
  }, [
    saveLoading,
    apiSaveError,
    saveData,
    uploadFilesLoading,
    uploadFilesError,
    uploadFilesData,
    deleteFilesLoading,
    deleteFilesError,
    deleteFilesData,
    postVideoJobsLoading,
    postVideoJobsData,
    postVideoJobsError,
    postFingerprintJobsLoading,
    postFingerprintJobsData,
    postFingerprintJobsError,
    onClose,
  ]);

  return (
    <>
      <DialogTitle>{album ? 'Edit Album' : 'Create Album'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ padding: 2 }}>
          <Grid size={{ xs: 3 }}>
            <FileSelector
              value={albumImageFile}
              albumId={id}
              onChange={file => setAlbum({ albumImageFile: file })}
            />
          </Grid>
          <Grid size={{ xs: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Artist"
                  fullWidth
                  value={artist}
                  onChange={e => setAlbum({ artist: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Title"
                  fullWidth
                  value={title}
                  onChange={e => setAlbum({ title: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="space-between">
                  <FormControl>
                    <InputLabel id="album-type-select-label">Type</InputLabel>

                    <Select
                      labelId="album-type-select-label"
                      id="album-type-select"
                      value={albumType}
                      label="Type"
                      onChange={e => setAlbum({ albumType: e.target.value })}
                    >
                      {albumTypes.map(t => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    startIcon={<SearchIcon />}
                    onClick={getMetadata}
                    sx={{ mt: 1 }}
                    color={metadataError ? 'error' : 'info'}
                    loading={metadataLoading}
                  >
                    Auto fill
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <AlbumFormSongList />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {saveError && (
          <Typography color="error">
            An error occurred saving the album: {saveError}
          </Typography>
        )}
        {metadataError && !saveError && (
          <Typography color="error">
            An error occurred searching for metadata: {metadataError.message}
          </Typography>
        )}
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button
          onClick={saveAlbum}
          variant="contained"
          color="primary"
          loading={
            saveLoading ||
            uploadFilesLoading ||
            deleteFilesLoading ||
            postVideoJobsLoading ||
            postFingerprintJobsLoading
          }
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
}
