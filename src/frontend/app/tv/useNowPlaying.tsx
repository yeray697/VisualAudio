import { useState, useEffect, useRef } from "react";
import { getNowPlaying } from "../api/albums";
import { Album, Song } from "../../types/album";
import { WEBSOCKET_BASE_URL } from "../../utils/envUtils";
import { Match, Message } from "../../types/message";

export function useNowPlaying() {
  const lastUpdateRef = useRef<number>(Date.now());
  const [match, setMatch] = useState<Match | null>(null);
  const matchRef = useRef<Match | null>(null); // siempre apunta al match actual
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    matchRef.current = match;
  }, [match]);
  
  const findCurrentTrack = (
  album: Album,
    elapsed: number,
    startingTrackId?: string
  ): { song: Song; pos: number } => {
    console.log("[findCurrentTrack] Album:", album.title, "Elapsed:", elapsed);

    let startIndex = 0;
    if (startingTrackId) {
      const idx = album.songs.findIndex((s) => s.id === startingTrackId);
      if (idx >= 0) startIndex = idx; // arrancamos desde la canción que el servidor dice
    }

    let acc = 0;

    for (let i = startIndex; i < album.songs.length; i++) {
      const track = album.songs[i];
      if (elapsed < acc + track.duration) {
        console.log("[findCurrentTrack] Found track:", track.name, "at pos:", elapsed - acc);
        return { song: track, pos: elapsed - acc };
      }
      acc += track.duration;
    }

    console.log("[findCurrentTrack] Reached end of album, using last track");
    const last = album.songs[album.songs.length - 1];
    return { song: last, pos: last.duration };
  };


  const updateTrack = (message: Message) => {
    const newMatch: Match = message.data;
    console.log("[updateTrack] Received WS message:", message);

    let elapsed = 0;
    if (message.messageReceived) {
      const messageReceived = new Date(message.messageReceived);
      elapsed = (Date.now() - messageReceived.getTime()) / 1000;
    }

    const playbackPos = Math.ceil(
      newMatch.times.trackMatchStart +
        (newMatch.times.recordedDuration - newMatch.times.queryMatchStart) +
        newMatch.times.latency +
        elapsed
    );

    console.log("[updateTrack] Calculated playbackPos:", playbackPos);

    const { song, pos } = findCurrentTrack(newMatch.album, playbackPos, newMatch.nowPlaying.id);
    console.log("[updateTrack] Updating match to song:", song.name, "pos:", pos, "duration:", song.duration);
    setMatch({ ...newMatch, nowPlaying: song });
    startProgressUpdater(pos, song.duration, newMatch.album);
  };
  
  const startProgressUpdater = (startPos: number, trackDuration: number, album: Album) => {
    console.log("[startProgressUpdater] Starting at pos:", startPos, "duration:", trackDuration);
    setPosition(startPos);
    setDuration(trackDuration);
    // limpiar siempre el anterior interval antes de crear uno nuevo
    if (progressInterval.current) clearInterval(progressInterval.current);
  
    lastUpdateRef.current = Date.now();

    progressInterval.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000; 
      lastUpdateRef.current = now;
      setPosition((p) => {
        const next = p + delta;
        console.log("[ProgressUpdater] Tick - current:", p, "next:", next, "/", trackDuration);
        if (next >= trackDuration) {
          console.log("[ProgressUpdater] Track ended, moving to next");
          handleTrackEnd(album);
          return trackDuration;
        }
        return next;
      });
    }, 1000);
  };

  const handleTrackEnd = (album: Album) => {
    const currentMatch = matchRef.current; // usar ref para evitar estado desincronizado
    if (!currentMatch) {
      console.warn("[handleTrackEnd] No match, can't update");
      return;
    }
    const currentIndex = album.songs.findIndex((s) => s.id === currentMatch.nowPlaying.id);
    console.log("[handleTrackEnd] Current track index:", currentIndex);
    const nextTrack = album.songs[currentIndex + 1];
    if (nextTrack) {
      console.log("[handleTrackEnd] Moving to next track:", nextTrack.name);
      setMatch({ ...currentMatch, nowPlaying: nextTrack });
      setPosition(0);
      setDuration(nextTrack.duration);
    } else {
      console.log("[handleTrackEnd] No more tracks, stopping");
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };


  useEffect(() => {
    console.log("[useEffect] Initializing hook...");
    getNowPlaying().then(updateTrack);

    const ws = new WebSocket(`${WEBSOCKET_BASE_URL}/ws`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("[WebSocket] Message received:", msg);
      if (msg.type === "NOW_PLAYING") updateTrack(msg);
    };

    return () => {
      console.log("[useEffect] Cleaning up...");
      ws.close();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);
  return { nowPlaying: match, position, duration };
}
