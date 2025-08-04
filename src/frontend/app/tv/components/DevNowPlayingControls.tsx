import { useNowPlayingStore } from "../../../store/nowPlayingStore";

export const DevNowPlayingControls = () => {
  const { overrideNowPlaying, clearOverride } = useNowPlayingStore();

  const fakeSong = {
    id: "dev-song",
    name: "Test Song",
    position: 0,
    duration: 120,
  };

  const fakeAlbum = {
    id: "dev-album",
    title: "Dev Album",
    artist: "Dev Artist",
    songs: [fakeSong],
  };

  return (
    <div>
      <button
        // onClick={() =>
        //   overrideNowPlaying({
        //     updatedAt: new Date(),
        //     nowPlaying: fakeSong,
        //     album: fakeAlbum,
        //     confidence: 1,
        //     trackPosition: 0,
        //   })
        // }
      >
        Set Fake NowPlaying
      </button>
      <button onClick={clearOverride}>Back to Real</button>
    </div>
  );
};
