import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {kickPulse} from '../lib/audio';
import {loopRate, usePeriod} from '../lib/loop';
import {dawnAt, tiltAt} from '../lib/timeline';
import {palette} from '../theme';

const PLATE_W = 1296;
const PLATE_H = 2304;

/**
 * The painted sky from inside the window artwork, graded between a deep
 * plum dusk and a pastel dawn. It drifts slowly and tilts up on "stare into
 * the sky".
 */
export const Sky: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	const dawn = dawnAt(t, period);
	const tilt = tiltAt(t, period);
	const kick = kickPulse(frame, fps, 0.3);

	const driftX = Math.sin(t * loopRate(0.09, period)) * 46;
	const scale = 1.02 + 0.018 * Math.sin(t * loopRate(0.06, period)) + kick * 0.008;

	return (
		<AbsoluteFill style={{backgroundColor: palette.dusk, overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: (width - PLATE_W) / 2,
					top: (height - PLATE_H) / 2,
					width: PLATE_W,
					height: PLATE_H,
					transform: `translate(${driftX}px, ${tilt}px) scale(${scale})`,
				}}
			>
				<Img src={staticFile('fx/sky-dusk.jpg')} style={{position: 'absolute', width: '100%', height: '100%'}} />
				<Img
					src={staticFile('fx/sky-dawn.jpg')}
					style={{position: 'absolute', width: '100%', height: '100%', opacity: dawn}}
				/>
			</div>
			{/* Grade: plum sky at the top, warm peach haze near the horizon. */}
			<AbsoluteFill
				style={{
					background: `linear-gradient(180deg,
						rgba(42,27,71,${0.5 - 0.32 * dawn}) 0%,
						rgba(59,33,80,${0.18 - 0.12 * dawn}) 38%,
						rgba(233,173,209,${0.05 + 0.08 * dawn}) 72%,
						rgba(255,217,192,${0.1 + 0.16 * dawn}) 100%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
