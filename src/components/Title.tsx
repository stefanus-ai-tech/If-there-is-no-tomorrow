import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {bassAt} from '../lib/audio';
import {loopRate, PERIOD} from '../lib/loop';
import {shots, TITLE_CARD} from '../lib/timeline';
import {ASPECT, Art, Glow} from './Art';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TITLE_W = 880;
export const TITLE_Y = 372;
const CARD_Y = 840;
const INTRO_OUT: [number, number] = [6.1, 7.4];
const LIFT_AT = TITLE_CARD + 4.4;
export const WINDOW_IN = LIFT_AT + 0.2;

/**
 * The hand-lettered title (assets/10.png). It is on screen from the very
 * first frame as the hook, comes back as the end card, and ends in exactly
 * the opening position so the loop is seamless.
 */
export const Title: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const float = Math.sin(t * loopRate(0.7)) * 8;
	const bass = Math.min(1, bassAt(frame));

	let y = TITLE_Y;
	let scale = 1;
	let opacity = 0;
	if (t < INTRO_OUT[1]) {
		const out = interpolate(t, INTRO_OUT, [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
		opacity = 1 - out;
		y = TITLE_Y - out * 150;
		scale = 1 + out * 0.05;
	} else if (t >= TITLE_CARD - 0.05) {
		const p = spring({frame: frame - TITLE_CARD * fps, fps, config: {damping: 13, mass: 1}});
		const lift = interpolate(t, [LIFT_AT, LIFT_AT + 2.4], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
		y = interpolate(lift, [0, 1], [CARD_Y, TITLE_Y]);
		scale = interpolate(lift, [0, 1], [1.14, 1]) * (0.55 + 0.45 * p);
		opacity = Math.min(1, p * 1.6);
	}
	if (opacity <= 0.001) {
		return null;
	}
	const h = TITLE_W * ASPECT[10];
	return (
		<AbsoluteFill style={{opacity}}>
			<div
				style={{
					position: 'absolute',
					left: 540 - TITLE_W / 2,
					top: y - h / 2,
					width: TITLE_W,
					height: h,
					transform: `translateY(${float}px) scale(${scale})`,
				}}
			>
				<Glow n={10} width={TITLE_W} opacity={0.45 + 0.3 * bass} />
				<Art n={10} width={TITLE_W} />
			</div>
		</AbsoluteFill>
	);
};

/**
 * The window returns behind the end card and the camera pushes back into
 * it, landing on the exact framing of frame 0.
 */
export const LoopWindow: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	if (t < WINDOW_IN) {
		return null;
	}
	const first = shots[0];
	const size = first.size;
	const h = size * ASPECT[first.asset];
	const p = spring({frame: frame - WINDOW_IN * fps, fps, config: {damping: 16, mass: 1.1}});
	const settle = WINDOW_IN + 1.4;
	const push =
		t < PERIOD - 1.5
			? interpolate(t, [settle, PERIOD - 1.5], [1, 1.28], clamp)
			: interpolate(t, [PERIOD - 1.5, PERIOD], [1.28, 2.7], {...clamp, easing: Easing.in(Easing.cubic)});
	const scale = (0.6 + 0.4 * p) * push;
	// same oscillators as the opening shot (seed 0) so the loop lines up
	const float = Math.sin(t * loopRate(0.9)) * 16;
	const sway = Math.sin(t * loopRate(0.6)) * 2.5;
	const glow = 0.5 + 0.35 * Math.min(1.2, bassAt(frame));
	return (
		<AbsoluteFill style={{opacity: Math.min(1, p * 1.5)}}>
			<div
				style={{
					position: 'absolute',
					left: 540 - size / 2,
					top: first.y - h / 2,
					width: size,
					height: h,
					transform: `translate(0px, ${float}px) rotate(${sway}deg) scale(${scale})`,
				}}
			>
				<Glow n={first.asset} width={size} opacity={Math.min(1, glow)} />
				<Art n={first.asset} width={size} />
			</div>
		</AbsoluteFill>
	);
};
