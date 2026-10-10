import React from 'react';
import {Img} from 'remotion';
import {artSrc} from './Art';

// In assets/1.png the body runs from the jewel head (~655,640) down to the
// tail (~560,885) on a 1254px canvas, i.e. tilted ~21deg off vertical.
const SRC = 1254;
const BODY = {x: 607, y: 762};
const TILT = 21;

/**
 * Splits the butterfly along its body and swings each wing in 3D so it
 * actually flaps. `flap` is 0 (open) .. 1 (wings raised).
 */
export const FlappingButterfly: React.FC<{width: number; flap: number}> = ({width, flap}) => {
	const k = width / SRC;
	const bx = BODY.x * k;
	const by = BODY.y * k;
	const angle = flap * 62;
	const img = (
		<Img
			src={artSrc(1)}
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width,
				height: width,
				transformOrigin: `${bx}px ${by}px`,
				transform: `rotate(${-TILT}deg)`,
			}}
		/>
	);
	const wing = (side: 'left' | 'right') => (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				clipPath:
					side === 'left'
						? `polygon(0 0, ${bx + 1}px 0, ${bx + 1}px 100%, 0 100%)`
						: `polygon(${bx - 1}px 0, 100% 0, 100% 100%, ${bx - 1}px 100%)`,
				transformOrigin: `${bx}px ${by}px`,
				// Each wing carries its own perspective instead of sharing a
				// preserve-3d context: headless Chrome's 3D sorting dropped the
				// right wing on every frame it was rotated, so it flickered.
				transform: `perspective(1600px) rotateY(${side === 'left' ? angle : -angle}deg)`,
				filter: `brightness(${1 - flap * 0.18})`,
			}}
		>
			{img}
		</div>
	);
	return (
		<div
			style={{
				position: 'relative',
				width,
				height: width,
				transformOrigin: `${bx}px ${by}px`,
				transform: `rotate(${TILT}deg)`,
			}}
		>
			{wing('left')}
			{wing('right')}
		</div>
	);
};

/** Flap curve: quick down-stroke, slower glide back up. */
export const flapAt = (t: number, rate: number, phase = 0) => {
	const c = (t * rate + phase) % 1;
	return c < 0.35 ? Math.sin((c / 0.35) * (Math.PI / 2)) : Math.cos(((c - 0.35) / 0.65) * (Math.PI / 2));
};
