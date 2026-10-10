import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {FlappingButterfly, flapAt} from './Butterfly';

type Flight = {at: number; duration: number; count: number; seed: string};

/**
 * Small butterflies taking off from the bottom of the frame and fluttering
 * up through the sky.
 */
export const Swarm: React.FC<{flights: Flight[]}> = ({flights}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const t = frame / fps;
	const birds = useMemo(
		() =>
			flights.flatMap((f) =>
				new Array(f.count).fill(0).map((_, i) => ({
					at: f.at + random(`${f.seed}d${i}`) * f.duration * 0.45,
					life: f.duration * (0.6 + random(`${f.seed}l${i}`) * 0.4),
					x0: 60 + random(`${f.seed}x${i}`) * (width - 120),
					drift: (random(`${f.seed}h${i}`) - 0.5) * 520,
					size: 110 + random(`${f.seed}s${i}`) * 130,
					rate: 3 + random(`${f.seed}r${i}`) * 1.6,
					phase: random(`${f.seed}p${i}`),
					sway: 30 + random(`${f.seed}w${i}`) * 50,
					tilt: (random(`${f.seed}t${i}`) - 0.5) * 50,
				})),
			),
		[flights, width],
	);
	return (
		<AbsoluteFill>
			{birds.map((b, i) => {
				const p = (t - b.at) / b.life;
				if (p < 0 || p > 1) {
					return null;
				}
				const y = height + 150 - p * (height + 450);
				const x = b.x0 + b.drift * p + Math.sin(p * 9 + b.phase * 6) * b.sway;
				const flap = flapAt(t, b.rate, b.phase);
				const fade = Math.min(1, p * 6, (1 - p) * 5);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - b.size / 2,
							top: y - b.size / 2,
							opacity: fade,
							transform: `rotate(${b.tilt + Math.sin(p * 7) * 10}deg)`,
						}}
					>
						<FlappingButterfly width={b.size} flap={flap} />
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
