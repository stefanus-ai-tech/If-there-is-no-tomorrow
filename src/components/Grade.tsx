import React from 'react';
import {AbsoluteFill, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {energyAt, kickPulse} from '../lib/audio';
import {loopRate, usePeriod} from '../lib/loop';
import {dawnAt} from '../lib/timeline';

/** Warm light leaks that slowly sweep across the frame (screen blended). */
export const LightLeaks: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	const energy = Math.min(1.1, energyAt(frame));
	const dawn = dawnAt(t, period);
	const a = 0.16 + 0.22 * energy * (0.5 + 0.5 * dawn);
	const x1 = 50 + Math.sin(t * loopRate(0.13, period)) * 45;
	const y1 = 18 + Math.cos(t * loopRate(0.11, period)) * 12;
	const x2 = 50 + Math.cos(t * loopRate(0.09, period) + 1) * 50;
	const y2 = 80 + Math.sin(t * loopRate(0.07, period)) * 10;
	return (
		<AbsoluteFill
			style={{
				mixBlendMode: 'screen',
				opacity: a,
				background: `radial-gradient(ellipse 60% 38% at ${x1}% ${y1}%, rgba(255,217,192,0.9), rgba(255,217,192,0) 70%),
					radial-gradient(ellipse 70% 30% at ${x2}% ${y2}%, rgba(233,173,209,0.85), rgba(233,173,209,0) 70%)`,
			}}
		/>
	);
};

export const Vignette: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const dawn = dawnAt(frame / fps, period);
	const edge = 0.62 - 0.22 * dawn;
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 85% 70% at 50% 46%, rgba(26,14,40,0) 52%, rgba(26,14,40,${edge}) 100%)`,
			}}
		/>
	);
};

/** Analog grain: a noise tile jittered every frame. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.05}) => {
	// re-rolled every other frame: reads as film grain without starving the encoder
	const seed = Math.floor(useCurrentFrame() / 2);
	const ox = Math.floor(random(`gx${seed}`) * 256);
	const oy = Math.floor(random(`gy${seed}`) * 256);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${staticFile('fx/grain.png')})`,
				backgroundPosition: `${ox}px ${oy}px`,
				mixBlendMode: 'overlay',
				opacity,
			}}
		/>
	);
};

/** Bloom flashes on big hits plus a faint lift on every kick. */
export const Flash: React.FC<{hits: {at: number; strength: number}[]}> = ({hits}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	let v = kickPulse(frame, fps, 0.16) * 0.07 * Math.min(1, energyAt(frame));
	for (const h of hits) {
		const dt = t - h.at;
		if (dt >= -0.05 && dt < 1.2) {
			const rise = dt < 0 ? (dt + 0.05) / 0.05 : 1;
			v = Math.max(v, h.strength * rise * Math.exp(-Math.max(0, dt) / 0.28));
		}
	}
	if (v < 0.003) {
		return null;
	}
	return (
		<AbsoluteFill
			style={{
				mixBlendMode: 'screen',
				opacity: Math.min(1, v),
				background: 'radial-gradient(ellipse 80% 60% at 50% 42%, #fff6fa 0%, #f7cdd1 45%, #cfa4e3 100%)',
			}}
		/>
	);
};
