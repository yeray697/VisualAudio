"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CardActions,
  Grid,
} from "@mui/material";
import { NoPhotography } from "@mui/icons-material";
import { Album } from "../../../types/album";
import { getAlbumFileUrl } from "../../../utils/albumFileUtils";
import { useConfig } from "../../providers/ConfigProvider";

interface Props {
  album: Album;
  onEditClicked: (album: Album) => void;
}

export default function AlbumsListItem({ album, onEditClicked }: Props) {
  const config = useConfig();
  const imageUrl = getAlbumFileUrl(config.apiUrl, album.albumImageFilename, album.id);
  return (
    <Grid size={{xs: 12, sm: 6, md: 4 }} key={album.id}>
      <Card>
        {
          imageUrl ?
            <CardMedia
              component="img"
              height="180"
              image={imageUrl}
              alt={album.title}
            />
          :
          <div style={{width: '100%', height: '180px'}}>
            <NoPhotography sx={{fontSize: 64}}/>
          </div>
        }
        <CardContent>
          <Typography variant="h6">{album.title}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {album.artist}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {album.songs.length} songs
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" onClick={() => onEditClicked(album)}>
            Edit
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
}