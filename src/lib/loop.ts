import {useVideoConfig} from 'remotion';
import {audio} from './audio';

export const FPS = 30;
/** The whole song. */
export const FULL_END = audio.duration;
/**
 * The TikTok cut stops once the outro has faded (the last ~10 s of the
 * master are near-silent), so the replay starts while viewers are still in.
 */
export const TIKTOK_END = 104;

export const framesFor = (seconds: number) => Math.ceil(seconds * FPS);

/** Loop period in seconds: the frame after the last one is frame 0 again. */
export const usePeriod = () => {
	const {durationInFrames, fps} = useVideoConfig();
	return durationInFrames / fps;
};

/**
 * TikTok replays videos back to back. Every ambient oscillator is snapped to
 * a whole number of cycles over the video so the last frame flows straight
 * into the first one.
 */
export const loopRate = (rate: number, period: number) => {
	const n = Math.max(1, Math.round((rate * period) / (2 * Math.PI)));
	return (n * 2 * Math.PI) / period;
};

/** Linear speed (px/s) that travels a whole number of `span`s per loop. */
export const loopSpeed = (speed: number, span: number, period: number) => {
	if (speed === 0) {
		return 0;
	}
	const n = Math.max(1, Math.round(Math.abs(speed * period) / span));
	return (Math.sign(speed) * n * span) / period;
};
