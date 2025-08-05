"use client";

import { useMemo } from "react";
import { formatDurationToTimeString } from "../../utils/timeUtils";
import { DevNowPlayingSource } from "../sources/DevNowPlayingSource";
import { DevNowPlayingControls } from "./components/DevNowPlayingControls";
import { useNowPlaying } from "./useNowPlaying";
import { useBackendNowPlayingSource } from "../sources/BackendNowPlayingSource";
import { Player } from "./components/Player";
import { Box, Grid } from "@mui/material";

  const album = {
    "id": "598e046c-e157-44c8-a1fb-209e01da6487",
    "title": "Thrill Of The Arts",
    
    "artist": "Vulfpeck",
    "albumImageFilename": "album-cover.jpeg",
    "songs": [
        {
            "id": "1b56b790-ae6c-4da6-8deb-ca9241026fa9",
            "name": "Welcome To Vulf Records",
            "position": 1,
            "duration": 163,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059827Z",
            "updatedAt": "2025-08-04T19:01:00.4059827Z"
        },
        {
            "id": "a4df8752-6e78-41d5-85a8-583e500cd00a",
            "name": "Back Pocket",
            "position": 2,
            "duration": 181,
            "lyrics": null,
            "fingerprintId": "14e00120-a7af-4b3c-82ea-4982af4ea963",
            "songFilename": "song.mp3",
            "createdAt": "2025-08-04T19:01:00.4059891Z",
            "updatedAt": "2025-08-04T19:01:00.4059892Z"
        },
        {
            "id": "dd090371-7a81-44a7-842d-9429d6dfe001",
            "name": "Funky Duck",
            "position": 3,
            "duration": 131,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059908Z",
            "updatedAt": "2025-08-04T19:01:00.4059908Z"
        },
        {
            "id": "f2bb9e36-fd75-4061-b7b4-6f20af91483c",
            "name": "Rango II",
            "position": 4,
            "duration": 251,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059924Z",
            "updatedAt": "2025-08-04T19:01:00.4059924Z"
        },
        {
            "id": "ad0d2d81-382b-47b3-b744-c6a2cb1c126f",
            "name": "Game Winner",
            "position": 5,
            "duration": 213,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059938Z",
            "updatedAt": "2025-08-04T19:01:00.4059939Z"
        },
        {
            "id": "ab78fd26-7dd4-41eb-b332-5bb080cb127f",
            "name": "Walkies",
            "position": 6,
            "duration": 63,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059954Z",
            "updatedAt": "2025-08-04T19:01:00.4059954Z"
        },
        {
            "id": "ff63aacc-6833-4283-a996-2b9d8a637a92",
            "name": "Christmas In L.A.",
            "position": 7,
            "duration": 183,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059968Z",
            "updatedAt": "2025-08-04T19:01:00.4059969Z"
        },
        {
            "id": "46baf2e3-7668-4623-b7c8-d33b571d4ca4",
            "name": "Conscious Club (Instrumental)",
            "position": 8,
            "duration": 184,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4059993Z",
            "updatedAt": "2025-08-04T19:01:00.4059993Z"
        },
        {
            "id": "13f8d8a1-81a3-44a4-bbe1-7fe27dcc816c",
            "name": "Smile Meditation",
            "position": 9,
            "duration": 269,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4060007Z",
            "updatedAt": "2025-08-04T19:01:00.4060007Z"
        },
        {
            "id": "727cde03-3d4f-490f-a23e-5beddd85957d",
            "name": "Guided Smile Meditation",
            "position": 10,
            "duration": 309,
            "lyrics": null,
            "createdAt": "2025-08-04T19:01:00.4060029Z",
            "updatedAt": "2025-08-04T19:01:00.406003Z"
        }
    ]
  };

export default function TVPage() {



  const devSource = useMemo(() => new DevNowPlayingSource(), []);

  const { nowPlaying, refreshData } = useNowPlaying(devSource);

  // const backendSource = useBackendNowPlayingSource();

  // const stableSource = useMemo(() => {
  //   if (!backendSource) return null;
  //   return {
  //     async getNowPlaying() {
  //       return backendSource.getNowPlaying();
  //     }
  //   };
  // }, [backendSource]);


  // const { nowPlaying } = useNowPlaying(stableSource);



  return (
    <main style={{padding: "2rem", width: "100%", margin: 0, fontFamily: "Arial, sans-serif"}}>
      <Grid container>
        <Grid size={{ xs:2 }}>
          <DevNowPlayingControls 
            onSelectedNowPlaying={(devNowPlaying) => {
              devSource.setNowPlaying(devNowPlaying)
              refreshData();
            }}
          />
        </Grid>
        <Grid size={{ xs:10 }}>
          <Player />
        </Grid>
      </Grid>
    </main>
  );
}
