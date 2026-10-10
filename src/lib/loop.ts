import {audio} from './audio';

export const FPS = 30;
export const DURATION_FRAMES = Math.ceil(audio.duration * FPS);
/** Loop period in seconds: the frame after the last one is frame 0 again. */
export const PERIOD = DURATION_FRAMES / FPS;

/**
 * TikTok replays videos back to back. Every ambient oscillator is snapped to
 * a whole number of cycles over the video so the last frame flows straight
 * into the first one.
 */
export const loopRate = (rate: number) => {
	const n = Math.max(1, Math.round((rate * PERIOD) / (2 * Math.PI)));
	return (n * 2 * Math.PI) / PERIOD;
};

/** Linear speed (px/s) that travels a whole number of `span`s per loop. */
export const loopSpeed = (speed: number, span: number) => {
	if (speed === 0) {
		return 0;
	}
	const n = Math.max(1, Math.round(Math.abs(speed * PERIOD) / span));
	return (Math.sign(speed) * n * span) / PERIOD;
};
