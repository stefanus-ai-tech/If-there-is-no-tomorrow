# If I Have No Tomorrow — TikTok lyric MV

A vertical (1080×1920, 30 fps) lyric music video for **"If I Have No Tomorrow"**,
built with [Remotion](https://www.remotion.dev/) from the artwork in `assets/`,
the song (`v6 If I Have No Tomorrow.mp3`) and `Lyric.txt`.

## Quick start

```bash
npm install
npm run dev       # Remotion Studio: preview and scrub the video
npm run render    # renders out/if-i-have-no-tomorrow-tiktok.mp4 (H.264, ready for TikTok)
npm run still     # renders out/cover.png (frame 0, works as the TikTok cover)
```

`npm run dev/render/still` first copy `assets/*.png` and the song into
`public/` (git-ignored), so the originals stay where they are.

## Look

- **Palette** sampled from the artwork: pearl `#FFF6FA`, petal `#F7CDD1`,
  orchid `#E9ADD1`, lilac `#EBC4EA`, lavender `#CFA4E3`, mauve `#CA8EC1`,
  rose gold `#E8ADAE`, plum `#AA6B90`, periwinkle `#9680D0`, dusk `#2A1B47`.
- **Sky**: the painted sky inside the window artwork (`9.png`) is the
  backdrop, graded from plum *dusk* (verse) to pastel *dawn* (chorus).
  "Sinful" clouds it over, "forgiven" glows, the outro sinks back to dusk.
- **Type**: Cormorant Garamond italic for the lyric, Pinyon Script with a
  pearl shimmer for one keyword per line (*myself, worse, knows, gone, fair,
  there, sky, be, butterfly, star, best, flow, tomorrow, borrow, doin', forgiven*).
  Lyrics only, no chords or section labels.

## Built for retention

- **Hook in frame 0**: the title lettering over the open window, then an
  immediate zoom-out. Vocals start at 1.4 s.
- **A new focal point every 2–6 s**: each lyric line gets its own artwork
  (heart, swirl, hourglass, tear, moon, clouds, star, butterfly, window) with
  its own entrance and motion (the butterfly really flaps, the hourglass
  flips on "tomorrow", the tear ripples on "fair", the star flares…).
- **Word-by-word karaoke** timed from the actual vocal (see below), so the
  eye keeps reading along.
- **Pattern breaks**: cloud wipe into "stare into the sky", one-word-at-a-time
  pre-chorus ("And / will / I / be"), a bloom flash and a butterfly swarm on
  the chorus drop, short pastel glitches on "sinful" (the track is tagged
  glitchy indietronica).
- **Instrumental outro**: a kick-synced montage of every artwork, then the
  title end card.
- **Seamless loop**: every ambient motion completes whole cycles over the
  video and the last frames push back into the window, landing on the
  framing of frame 0, so TikTok's auto-replay flows straight into a rewatch.
- **Safe zones**: lyrics stay inside x 90–930 / y 1090–1510, clear of the
  TikTok top bar, right-hand action rail and caption block.

## Project layout

```
src/
  MV.tsx               layer stack of the composition
  Root.tsx             <Composition id="MV" />
  theme.ts             palette, fonts, safe zones
  lib/timeline.ts      which artwork goes with which line, dusk/dawn curve, outro
  lib/audio.ts         kick / energy / vocal envelopes for audio-reactive FX
  lib/loop.ts          loop-continuity helpers
  components/          Sky, Clouds, Particles, Hero, Butterfly, Swarm, Lyrics, Title, Grade
  data/lyrics.json     word-level lyric timing (generated)
  data/audio.json      kicks, beats and envelopes at 30 fps (generated)
public/fx/             textures baked from the artwork (sky plates, glows, grain)
scripts/
  sync-assets.mjs      copies artwork + song into public/
  make-fx.py           bakes public/fx from assets/
  analyze_song.py      re-times lyrics and extracts audio features
```

## New version of the song?

Replace the mp3 (and update its name in `scripts/sync-assets.mjs` and
`scripts/analyze_song.py`), edit `Lyric.txt`, then:

```bash
pip install demucs faster-whisper librosa soundfile numpy
python3 scripts/analyze_song.py
```

It separates the vocal with demucs, transcribes it with Whisper (word
timestamps), snaps each word to the real vocal onset, aligns it to
`Lyric.txt` and rewrites `src/data/*.json`. The visuals follow automatically;
check `src/lib/timeline.ts` if the song structure changed.
