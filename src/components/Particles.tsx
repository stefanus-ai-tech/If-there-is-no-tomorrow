import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {airAt, energyAt, kickPulse} from '../lib/audio';
import {loopRate, loopSpeed} from '../lib/loop';
import {palette} from '../theme';

const STAR_PATH = 'M0,-1 C0.08,-0.08 0.08,-0.08 1,0 C0.08,0.08 0.08,0.08 0,1 C-0.08,0.08 -0.08,0.08 -1,0 C-0.08,-0.08 -0.08,-0.08 0,-1 Z';

/** Four-point twinkles scattered over the sky; they shimmer with the hi-hats. */
export const Twinkles: React.FC<{count?: number; seed?: string}> = ({count = 34, seed = 'tw'}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const air = airAt(frame);
	const kick = kickPulse(frame, fps, 0.25);
	const stars = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => ({
				x: random(`${seed}x${i}`) * width,
				y: Math.pow(random(`${seed}y${i}`), 1.4) * height * 0.78,
				r: 6 + Math.pow(random(`${seed}r${i}`), 2.2) * 30,
				speed: loopRate(0.8 + random(`${seed}s${i}`) * 2.2),
				phase: random(`${seed}p${i}`) * Math.PI * 2,
				rot: random(`${seed}o${i}`) * 30 - 15,
			})),
		[count, seed, width, height],
	);
	return (
		<AbsoluteFill>
			<svg width={width} height={height} style={{position: 'absolute'}}>
				<defs>
					<radialGradient id="twGlow">
						<stop offset="0%" stopColor="#fff" stopOpacity={0.95} />
						<stop offset="35%" stopColor={palette.orchid} stopOpacity={0.45} />
						<stop offset="100%" stopColor={palette.lavender} stopOpacity={0} />
					</radialGradient>
				</defs>
				{stars.map((s, i) => {
					const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
					const a = Math.min(1, (0.2 + 0.8 * tw * tw) * (0.65 + 0.5 * air) + kick * 0.25);
					const r = s.r * (0.7 + 0.45 * tw);
					return (
						<g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot + t * loopSpeed(8, 90)})`} opacity={a}>
							<circle r={r * 0.9} fill="url(#twGlow)" />
							<path d={STAR_PATH} transform={`scale(${r})`} fill="#fff" />
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

/** Out-of-focus light orbs drifting upward. */
export const Bokeh: React.FC<{count?: number; seed?: string; near?: boolean}> = ({count = 18, seed = 'bk', near = false}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const energy = energyAt(frame);
	const colors = [palette.petal, palette.lavender, palette.peach, palette.orchid, palette.lilac];
	const orbs = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => ({
				x: random(`${seed}x${i}`) * width,
				y0: random(`${seed}y${i}`) * (height + 400),
				size: near ? 160 + random(`${seed}s${i}`) * 220 : 30 + random(`${seed}s${i}`) * 110,
				speed: (near ? 46 : 18) + random(`${seed}v${i}`) * (near ? 60 : 30),
				sway: 20 + random(`${seed}w${i}`) * 50,
				phase: random(`${seed}p${i}`) * Math.PI * 2,
				color: colors[Math.floor(random(`${seed}c${i}`) * colors.length)],
				alpha: 0.18 + random(`${seed}a${i}`) * 0.32,
			})),
		[count, seed, width, height, near],
	);
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen'}}>
			{orbs.map((o, i) => {
				const span = height + o.size * 2;
				const y = ((((o.y0 - t * loopSpeed(o.speed, span)) % span) + span) % span) - o.size;
				const x = o.x + Math.sin(t * loopRate(0.4) + o.phase) * o.sway;
				const a = o.alpha * (0.55 + 0.6 * Math.min(1, energy));
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - o.size / 2,
							top: y,
							width: o.size,
							height: o.size,
							borderRadius: '50%',
							opacity: a,
							background: `radial-gradient(circle at 50% 50%, ${o.color} 0%, ${o.color}cc ${near ? 18 : 38}%, ${o.color}00 70%)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Fine glitter dust falling and catching the light, denser when the song is loud. */
export const Glitter: React.FC<{count?: number; seed?: string}> = ({count = 70, seed = 'gl'}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const energy = Math.min(1.1, energyAt(frame));
	const dots = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => ({
				x: random(`${seed}x${i}`) * (width + 200) - 100,
				y0: random(`${seed}y${i}`) * height,
				size: 2 + Math.pow(random(`${seed}s${i}`), 3) * 7,
				speed: 40 + random(`${seed}v${i}`) * 90,
				drift: -30 + random(`${seed}d${i}`) * 25,
				phase: random(`${seed}p${i}`) * Math.PI * 2,
				blink: 2 + random(`${seed}b${i}`) * 5,
				threshold: random(`${seed}t${i}`),
			})),
		[count, seed, width, height],
	);
	return (
		<AbsoluteFill>
			{dots.map((d, i) => {
				// Each dot only shows above a certain loudness, so quiet parts stay calm.
				if (d.threshold > 0.25 + energy * 0.85) {
					return null;
				}
				const y = (((d.y0 + t * loopSpeed(d.speed, height)) % height) + height) % height;
				const x = d.x + t * loopSpeed(d.drift, width + 200) + Math.sin(t * loopRate(1.3) + d.phase) * 14;
				const blink = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * loopRate(d.blink) + d.phase), 3);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: ((x % (width + 200)) + width + 200) % (width + 200) - 100,
							top: y,
							width: d.size,
							height: d.size,
							borderRadius: '50%',
							background: '#fff',
							opacity: blink,
							boxShadow: `0 0 ${d.size * 3}px ${d.size}px rgba(247,205,209,0.7)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};
