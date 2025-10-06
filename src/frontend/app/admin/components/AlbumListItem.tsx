'use client';

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
} from '@mui/material';
import { NoPhotography } from '@mui/icons-material';
import { Album } from '../../../types/album';
import { getAlbumFileUrl } from '../../../utils/albumFileUtils';
import { useConfig } from '../../providers/ConfigProvider';

interface Props {
  album: Album;
  onEditClicked: (album: Album) => void;
  onRemoveClicked: (album: Album) => void;
}

export default function AlbumsListItem({
  album,
  onEditClicked,
  onRemoveClicked,
}: Props) {
  const config = useConfig();
  const imageUrl = getAlbumFileUrl(config.apiUrl, album.albumImageFilename);
  return (
    <Card>
      {imageUrl ? (
        <CardMedia
          component="img"
          height="180"
          image={imageUrl}
          alt={album.title}
        />
      ) : (
        <div style={{ width: '100%', height: '180px' }}>
          <NoPhotography sx={{ fontSize: 64 }} />
        </div>
      )}
      <CardContent>
        <Typography variant="h6">{album.title}</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {album.artist}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {album.songs.length} songs
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Button
          size="small"
          onClick={() => onRemoveClicked(album)}
          sx={{ marginLeft: 'auto' }}
          color="error"
        >
          Remove
        </Button>
        <Button size="small" onClick={() => onEditClicked(album)} sx={{}}>
          Edit
        </Button>
      </CardActions>
    </Card>
  );
}
