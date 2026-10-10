import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loopRate, loopSpeed, usePeriod} from '../lib/loop';
import {dawnAt, tiltAt} from '../lib/timeline';

type Bank = {src: string; w: number; y: number; speed: number; phase: number; opacity: number; flip?: boolean; depth: number};

// Far banks use the pre-blurred cloud (depth of field), near banks the crisp art.
const FAR: Bank[] = [
	{src: 'fx/soft-4.png', w: 1500, y: 1180, speed: 9, phase: 0, opacity: 0.55, depth: 0.5},
	{src: 'fx/soft-4.png', w: 1300, y: 1380, speed: -7, phase: 700, opacity: 0.5, flip: true, depth: 0.6},
	{src: 'fx/soft-4.png', w: 1100, y: -120, speed: 6, phase: 300, opacity: 0.32, depth: 0.3},
];

const NEAR: Bank[] = [
	{src: 'assets/4.png', w: 1400, y: 1430, speed: 12, phase: 0, opacity: 0.9, depth: 1.3},
	{src: 'assets/4.png', w: 1300, y: 1540, speed: 12, phase: 1400, opacity: 0.95, flip: true, depth: 1.3},
];

const wrap = (v: number, span: number) => ((v % span) + span) % span;

const CloudBank: React.FC<{bank: Bank; t: number; tilt: number; tint: number}> = ({bank, t, tilt, tint}) => {
	const period = usePeriod();
	const span = 1080 + bank.w;
	const x = wrap(bank.phase + t * loopSpeed(bank.speed, span, period), span) - bank.w;
	const bob = Math.sin(t * loopRate(0.35, period) + bank.phase) * 10;
	return (
		<Img
			src={staticFile(bank.src)}
			style={{
				position: 'absolute',
				left: x,
				top: bank.y + tilt * bank.depth + bob,
				width: bank.w,
				opacity: bank.opacity,
				transform: bank.flip ? 'scaleX(-1)' : undefined,
				filter: `brightness(${0.78 + 0.3 * tint}) saturate(${0.9 + 0.2 * tint})`,
			}}
		/>
	);
};

export const FarClouds: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	const tilt = tiltAt(t, period);
	const dawn = dawnAt(t, period);
	return (
		<AbsoluteFill>
			{FAR.map((b, i) => (
				<CloudBank key={i} bank={b} t={t} tilt={tilt} tint={dawn} />
			))}
		</AbsoluteFill>
	);
};

export const NearClouds: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	const tilt = tiltAt(t, period);
	const dawn = dawnAt(t, period);
	return (
		<AbsoluteFill>
			{NEAR.map((b, i) => (
				<CloudBank key={i} bank={b} t={t} tilt={tilt} tint={dawn} />
			))}
		</AbsoluteFill>
	);
};

/** A cloud that sweeps past the lens to hide a scene change. */
export const CloudWipe: React.FC<{at: number; duration?: number}> = ({at, duration = 1.3}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const p = (t - (at - duration / 2)) / duration;
	if (p < 0 || p > 1) {
		return null;
	}
	const e = Easing.inOut(Easing.cubic)(p);
	const y = interpolate(e, [0, 1], [1950, -2700]);
	const opacity = interpolate(p, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
	return (
		<AbsoluteFill style={{opacity}}>
			<Img
				src={staticFile('fx/soft-4.png')}
				style={{position: 'absolute', left: -900, top: y - 250, width: 2900, opacity: 0.9}}
			/>
			<Img
				src={staticFile('assets/4.png')}
				style={{position: 'absolute', left: -700, top: y, width: 2500, transform: `rotate(${-6 + e * 8}deg)`}}
			/>
			<Img
				src={staticFile('assets/4.png')}
				style={{position: 'absolute', left: -600, top: y + 900, width: 2300, transform: 'scaleX(-1)'}}
			/>
		</AbsoluteFill>
	);
};
