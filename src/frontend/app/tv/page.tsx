"use client";

import { useNowPlaying } from "./useNowPlaying";

export default function TVPage() {
  const { nowPlaying, position, duration } = useNowPlaying();

  const getPositionAsString = () => {
    const currentMinute = Math.round(Math.floor(position / 60))
    const currentSecond = Math.round(position % 60).toString().padStart(2, "0");
    
    const totalMinute = Math.round(Math.floor(duration / 60))
    const totalSecond = Math.round(duration % 60).toString().padStart(2, "0");
    
    return `${currentMinute}:${currentSecond} / ${totalMinute}:${totalSecond}`;    
  }

  return (
    <main style={{padding: "2rem", maxWidth: "800px", margin: 0, fontFamily: "Arial, sans-serif"}}>
      {nowPlaying && (
        <section style={{padding: "1.5rem", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "2rem", background: "#333" }}>
          <h2>Canción detectada</h2>
          <p>
            <strong>{nowPlaying.nowPlaying.name}</strong> - {nowPlaying.album.artist}
          </p>
          <p>
            <em>{nowPlaying.album.title}</em>
          </p>
          <p>
            Confidence <em>{nowPlaying.confidence * 100} %</em>
          </p>
          <div>
            <input
              type="range"
              min={0}
              max={duration}
              value={position}
              onChange={() => {}}
              style={{ width: "100%" }}
            />
            <p>{getPositionAsString()}</p>
          </div>
          {/* Aquí más adelante añadiremos portada, letra, etc. */}
        </section>
      )}
    </main>
  );
}
