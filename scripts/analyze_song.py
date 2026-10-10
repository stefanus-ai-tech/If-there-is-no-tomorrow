"""Re-times the lyrics and extracts the audio features the video reacts to.

Writes src/data/lyrics.json and src/data/audio.json. Both are committed, so
this only needs to run again when the song or Lyric.txt changes.

Pipeline
  1. demucs splits the song into vocals / instrumental
  2. faster-whisper transcribes the vocal stem with word timestamps
     (Lyric.txt is passed as the prompt so the spelling matches)
  3. word starts that whisper glued onto the previous word are moved to the
     real vocal onset, and tails that run into silence are trimmed
  4. the words are aligned to Lyric.txt (section headers like [Chorus] are
     dropped), so the video always shows the official lyric text
  5. kick onsets, energy, vocal and high-frequency envelopes at 30 fps

Usage (Python 3.10+):
  pip install demucs faster-whisper librosa soundfile numpy
  python3 scripts/analyze_song.py
"""
import difflib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SONG = ROOT / "v6 If I Have No Tomorrow.mp3"
LYRICS = ROOT / "Lyric.txt"
OUT = ROOT / "src" / "data"
FPS = 30


def read_lyric_lines():
    lines = []
    for raw in LYRICS.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or re.fullmatch(r"\[.*\]", line):
            continue
        lines.append(line)
    return lines


def norm(word):
    return re.sub(r"[^a-z']", "", word.lower()).strip("'")


def separate(work):
    wav = work / "song.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(SONG), "-ar", "44100", str(wav)], check=True)
    subprocess.run(
        [sys.executable, "-m", "demucs", "--two-stems=vocals", "-n", "htdemucs", "-o", str(work / "sep"), str(wav)],
        check=True,
    )
    return work / "sep" / "htdemucs" / "song"


def transcribe(vocals_path, prompt):
    from faster_whisper import WhisperModel

    audio, _ = librosa.load(vocals_path, sr=16000, mono=True)
    model = WhisperModel("medium", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        audio.astype(np.float32), language="en", word_timestamps=True, initial_prompt=prompt, beam_size=5
    )
    words = []
    for seg in segments:
        for w in seg.words:
            words.append({"w": w.word.strip(), "s": float(w.start), "e": float(w.end)})
    return words


def refine(words, vocals_path):
    y, sr = librosa.load(vocals_path, sr=16000, mono=True)
    hop = int(sr * 0.01)
    frames = np.lib.stride_tricks.sliding_window_view(y, hop * 3)[::hop]
    rms = np.sqrt((frames**2).mean(1))
    rms = np.convolve(rms, np.ones(3) / 3, mode="same")
    rms /= np.percentile(rms, 99)
    voiced = rms > 0.12
    idx = lambda t: min(len(voiced) - 1, int(round(t / 0.01)))

    out, prev_end = [], 0.0
    for w in words:
        s, e = w["s"], w["e"]
        if not voiced[max(0, idx(s) - 30) : idx(e) + 30].any():
            continue  # whisper hallucinates text on instrumental passages
        lo, hi = max(prev_end, s - 0.35), max(s, e - 0.08)
        ns = s
        on_voice = voiced[max(0, idx(s) - 3) : idx(s) + 4].any()
        if not on_voice:
            for i in range(idx(lo), idx(hi)):
                if voiced[i] and not voiced[max(0, i - 5) : i].any():
                    ns = i * 0.01
                    break
            else:
                # no clean onset inside the word: take the first sung frame
                sung = np.where(voiced[idx(s) : idx(e) + 30])[0]
                ns = (idx(s) + sung[0]) * 0.01 if len(sung) else max(s, e - 0.15)
        ne = e
        sung = np.where(voiced[idx(ns) : idx(e)])[0]
        if len(sung):
            last = (idx(ns) + sung[-1]) * 0.01 + 0.12
            if last < e - 0.25:
                ne = last
        ne = max(ne, ns + 0.12)
        out.append({"w": w["w"], "s": ns, "e": ne})
        prev_end = ne
    return out


def align(lines, words):
    """Map every official lyric word onto a transcribed word (or interpolate)."""
    official = [(li, wi, tok) for li, line in enumerate(lines) for wi, tok in enumerate(line.split())]
    a = [norm(t) for _, _, t in official]
    b = [norm(w["w"]) for w in words]
    times = [None] * len(official)
    for block in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            w = words[block.b + k]
            times[block.a + k] = (w["s"], w["e"])
    # Fill gaps (misheard words) by interpolating between known neighbours.
    for i, t in enumerate(times):
        if t is not None:
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        start = times[i - 1][1] if i > 0 else 0.0
        end = times[j][0] if j < len(times) else start + 0.6 * (j - i)
        step = (end - start) / (j - i)
        for k in range(i, j):
            times[k] = (start + step * (k - i), start + step * (k - i + 1))
    result = []
    for (li, wi, tok), (s, e) in zip(official, times):
        if wi == 0:
            result.append({"text": lines[li], "words": []})
        result[-1]["words"].append({"text": tok, "start": round(s, 2), "end": round(e, 2)})
    return result


def features(stems):
    inst, sr = librosa.load(stems / "no_vocals.wav", sr=22050, mono=True)
    voc, _ = librosa.load(stems / "vocals.wav", sr=22050, mono=True)
    mix = inst + voc
    duration = len(mix) / sr
    hop = 256
    n = int(np.ceil(duration * FPS))

    def to_fps(env):
        t = librosa.frames_to_time(np.arange(len(env)), sr=sr, hop_length=hop)
        return np.interp(np.arange(n) / FPS, t, env)

    def normalize(env, p=98):
        return np.clip(env / np.percentile(env, p), 0, 1.2)

    spec = np.abs(librosa.stft(inst, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low_onset = librosa.onset.onset_strength(
        S=librosa.amplitude_to_db(spec[freqs < 130] + 1e-6), sr=sr, hop_length=hop
    )
    kicks = librosa.onset.onset_detect(
        onset_envelope=low_onset, sr=sr, hop_length=hop, units="time", delta=0.25, wait=8
    )
    strength = np.array([low_onset[librosa.time_to_frames(k, sr=sr, hop_length=hop)] for k in kicks])
    strength = strength / np.percentile(strength, 95)
    level = to_fps(normalize(librosa.feature.rms(y=mix, hop_length=hop)[0]))
    win = int(FPS * 1.5)
    energy = np.convolve(level, np.ones(win) / win, mode="same")
    tempo, beats = librosa.beat.beat_track(y=inst, sr=sr, hop_length=hop, units="time")
    r = lambda arr: [round(float(v), 3) for v in arr]
    return {
        "fps": FPS,
        "duration": round(duration, 3),
        "tempo": round(float(np.atleast_1d(tempo)[0]), 2),
        "beats": r(beats),
        "kicks": [[round(float(t), 3), round(float(min(s, 1.5)), 2)] for t, s in zip(kicks, strength)],
        "energy": r(energy),
        "vocal": r(to_fps(normalize(librosa.feature.rms(y=voc, hop_length=hop)[0]))),
        "bass": r(to_fps(normalize(spec[freqs < 130].sum(0)))),
        "air": r(to_fps(normalize(spec[freqs > 6000].sum(0)))),
    }


def main():
    lines = read_lyric_lines()
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        stems = separate(Path(tmp))
        words = transcribe(stems / "vocals.wav", " ".join(lines))
        words = refine(words, stems / "vocals.wav")
        lyrics = align(lines, words)
        audio = features(stems)
    (OUT / "lyrics.json").write_text(json.dumps(lyrics, indent=1), encoding="utf-8")
    (OUT / "audio.json").write_text(json.dumps(audio, separators=(",", ":")), encoding="utf-8")
    for line in lyrics:
        print(f"{line['words'][0]['start']:6.2f}-{line['words'][-1]['end']:6.2f}  {line['text']}")


if __name__ == "__main__":
    main()
