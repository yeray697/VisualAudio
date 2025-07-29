# Visual Audio
Bring your music collection to life!

Visual Audio is a web app that listens to the ambient audio to identify which song is playing in real-time. It also features an admin panel to manage the album and song catalog easily.

## How it works
- A sleek, player‑like web interface connects to a **WebSocket** to receive real‑time updates.
- When playback starts, it instantly displays **song details**, album art, and more.

## Under the hood
- [**SoundFingerprinting**](https://github.com/AddictedCS/soundfingerprinting) — to generate and match audio fingerprints.
- [Emy](https://emysound.com/) — a powerful audio fingerprint database.
- **Filesystem‑based catalog** — each album stores its metadata in a `metadata.json` file, along with cover art, fingerprinting audio, and other media.
