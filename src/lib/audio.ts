import raw from '../data/audio.json';

type AudioData = {
	fps: number;
	duration: number;
	tempo: number;
	beats: number[];
	kicks: [number, number][];
	energy: number[];
	vocal: number[];
	bass: number[];
	air: number[];
};

export const audio = raw as unknown as AudioData;

const sample = (arr: number[], frame: number) => {
	const f = Math.max(0, Math.min(arr.length - 1, frame));
	const i = Math.floor(f);
	const j = Math.min(arr.length - 1, i + 1);
	const k = f - i;
	return arr[i] * (1 - k) + arr[j] * k;
};

/** Smoothed loudness of the full mix (0..~1.2), good for section intensity. */
export const energyAt = (frame: number) => sample(audio.energy, frame);
/** Low-end envelope of the instrumental. */
export const bassAt = (frame: number) => sample(audio.bass, frame);
/** Loudness of the isolated vocal. */
export const vocalAt = (frame: number) => sample(audio.vocal, frame);
/** High-frequency shimmer of the instrumental (hats, glitter in the mix). */
export const airAt = (frame: number) => sample(audio.air, frame);

/** Decaying pulse that fires on every detected kick (0..~1.5). */
export const kickPulse = (frame: number, fps: number, decay = 0.22) => {
	const t = frame / fps;
	let v = 0;
	for (const [k, strength] of audio.kicks) {
		if (k > t) {
			break;
		}
		const dt = t - k;
		if (dt < decay * 5) {
			v = Math.max(v, strength * Math.exp(-dt / decay));
		}
	}
	return v;
};

const lastBeatIndex = (t: number) => {
	const b = audio.beats;
	let lo = 0;
	let hi = b.length - 1;
	if (t < b[0]) {
		return -1;
	}
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		if (b[mid] <= t) {
			lo = mid;
		} else {
			hi = mid - 1;
		}
	}
	return lo;
};

/** Soft pulse on every beat of the beat grid (0..1). */
export const beatPulse = (frame: number, fps: number, decay = 0.12) => {
	const t = frame / fps;
	const i = lastBeatIndex(t);
	if (i < 0) {
		return 0;
	}
	return Math.exp(-(t - audio.beats[i]) / decay);
};
