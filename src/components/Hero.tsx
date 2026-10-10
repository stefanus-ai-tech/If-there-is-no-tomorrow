import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {bassAt, beatPulse, kickPulse, vocalAt} from '../lib/audio';
import {loopRate, usePeriod} from '../lib/loop';
import {dawnAt, type Enter, type Exit, type Shot} from '../lib/timeline';
import {palette} from '../theme';
import {ASPECT, Art, Glow} from './Art';
import {FlappingButterfly, flapAt} from './Butterfly';

const ENTER_SECONDS: Record<Enter, number> = {
	bloom: 0.9,
	rise: 1,
	fall: 1.2,
	spin: 1,
	fly: 1.1,
	zoom: 1.5,
	glitch: 0.45,
	far: 2.4,
};

const EXIT_BEFORE = 0.3;
const EXIT_AFTER = 0.35;

type Pose = {x: number; y: number; rot: number; scale: number; opacity: number; chroma: number; glitch: number};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const enterPose = (kind: Enter, e: number, lin: number): Partial<Pose> => {
	switch (kind) {
		case 'bloom':
			return {scale: 0.55 + 0.45 * e, rot: (1 - e) * -12, opacity: Math.min(1, lin * 1.6)};
		case 'rise':
			return {y: (1 - e) * 380, opacity: Math.min(1, lin * 1.5), scale: 0.9 + 0.1 * e};
		case 'fall':
			return {y: (1 - e) * -1250, rot: (1 - e) * 14, opacity: Math.min(1, lin * 3)};
		case 'spin':
			return {rot: (1 - e) * -220, scale: 0.15 + 0.85 * e, opacity: Math.min(1, lin * 2)};
		case 'fly':
			return {x: (1 - e) * -820, y: Math.pow(1 - e, 2) * 760, rot: (1 - e) * -35, scale: 0.6 + 0.4 * e, opacity: Math.min(1, lin * 2.5)};
		case 'zoom':
			return {scale: 2.7 - 1.7 * e, opacity: 1};
		case 'glitch':
			return {opacity: lin < 0.25 ? (Math.floor(lin * 24) % 2 ? 1 : 0.2) : 1, chroma: (1 - lin) * 22, glitch: (1 - lin) * 1.2};
		case 'far':
			return {scale: 0.08 + 0.92 * e, opacity: Math.min(1, lin * 2)};
	}
};

const exitPose = (kind: Exit, x: number): Partial<Pose> => {
	const ease = Easing.in(Easing.cubic)(x);
	switch (kind) {
		case 'lift':
			return {y: -280 * ease, opacity: 1 - x, scale: 1 + 0.12 * ease};
		case 'through':
			return {scale: 1 + 3.2 * ease, opacity: 1 - Math.pow(x, 1.6)};
		case 'drop':
			return {y: 900 * ease, opacity: 1 - x * 0.8, rot: 10 * ease};
		case 'dissolve':
			return {opacity: 1 - x, scale: 1 - 0.12 * ease};
		case 'glitch':
			return {opacity: x > 0.6 ? 0 : 1 - x * 0.5, chroma: x * 26, glitch: x * 1.4};
	}
};

/** Accent envelope: 0 before, jumps to 1 at the accent and settles. */
const accentEnv = (t: number, at: number | undefined, decay = 0.6) => {
	if (at === undefined || t < at) {
		return 0;
	}
	return Math.exp(-(t - at) / decay);
};

const accentStep = (t: number, at: number | undefined, fps: number, frame: number) => {
	if (at === undefined) {
		return 0;
	}
	return spring({frame: frame - at * fps, fps, config: {damping: 14, mass: 1.1}});
};

export const Hero: React.FC<{shot: Shot; seed: number}> = ({shot, seed}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	if (t < shot.from - 0.02 || t > shot.to + EXIT_AFTER) {
		return null;
	}

	const local = t - shot.from;
	const enterDur = ENTER_SECONDS[shot.enter];
	const lin = Math.min(1, Math.max(0, local / enterDur));
	const e =
		shot.enter === 'zoom' || shot.enter === 'far'
			? Easing.out(Easing.cubic)(lin)
			: spring({frame: frame - shot.from * fps, fps, durationInFrames: Math.round(enterDur * fps), config: {damping: 15, mass: 0.9}});
	const xOut = interpolate(t, [shot.to - EXIT_BEFORE, shot.to + EXIT_AFTER], [0, 1], clamp);

	const pose: Pose = {x: 0, y: 0, rot: 0, scale: 1, opacity: 1, chroma: 0, glitch: 0};
	const apply = (p: Partial<Pose>) => {
		pose.x += p.x ?? 0;
		pose.y += p.y ?? 0;
		pose.rot += p.rot ?? 0;
		pose.scale *= p.scale ?? 1;
		pose.opacity *= p.opacity ?? 1;
		pose.chroma = Math.max(pose.chroma, p.chroma ?? 0);
		pose.glitch = Math.max(pose.glitch, p.glitch ?? 0);
	};
	apply(enterPose(shot.enter, e, lin));
	if (xOut > 0) {
		apply(exitPose(shot.exit, xOut));
	}

	// Ambient life shared by every artwork.
	const kick = kickPulse(frame, fps, 0.2);
	const bass = Math.min(1.2, bassAt(frame));
	const float = Math.sin(t * loopRate(0.9, period) + seed) * 16;
	const sway = Math.sin(t * loopRate(0.6, period) + seed * 2) * 2.5;
	const push = 1 + Math.min(1, local / Math.max(1, shot.to - shot.from)) * 0.06;
	apply({y: float, rot: sway, scale: push * (1 + kick * 0.035)});

	const acc = accentEnv(t, shot.accent);
	const accStep = accentStep(t, shot.accent, fps, frame);
	let glow = 0.5 + 0.35 * bass + acc * 0.45;
	let flip = 0;
	let flap = 0;
	let extra: React.ReactNode = null;
	let under: React.ReactNode = null;
	const size = shot.size;
	const h = size * ASPECT[shot.asset];

	switch (shot.motion) {
		case 'heart': {
			const beat = beatPulse(frame, fps, 0.1);
			apply({scale: 1 + beat * 0.025 + acc * 0.08});
			if (shot.accent !== undefined && t >= shot.accent && t < shot.accent + 0.3) {
				apply({chroma: (1 - (t - shot.accent) / 0.3) * 14, glitch: shot.enter === 'glitch' ? 0.5 : 0});
			}
			break;
		}
		case 'swirl':
			apply({rot: local * 7 - 10, scale: 1 + Math.sin(t * 0.8) * 0.04 + acc * 0.06});
			break;
		case 'hourglass': {
			flip = accStep * 180;
			extra = <SandStream width={size} height={h} t={t} visible={1 - Math.min(1, accStep * 3)} />;
			break;
		}
		case 'tear': {
			apply({rot: Math.sin(t * 1.6) * 3, scale: 1 + Math.sin(t * 2.1) * 0.012});
			if (shot.accent !== undefined && t > shot.accent) {
				under = <Ripples width={size} height={h} since={t - shot.accent} />;
				glow += Math.min(1, (t - shot.accent) * 1.5) * 0.25;
			}
			break;
		}
		case 'moon':
			apply({rot: Math.sin(t * 0.85 + 1) * 9 + accStep * 18});
			break;
		case 'clouds':
			apply({x: Math.sin(t * 0.35) * 40, scale: 1 + acc * 0.05});
			glow *= 0.55;
			break;
		case 'star': {
			apply({rot: local * 16, scale: 1 + acc * 0.18 + kick * 0.04});
			extra = <Flare size={size} t={t} boost={acc + kick * 0.4 + vocalAt(frame) * 0.2} />;
			break;
		}
		case 'butterfly':
			flap = flapAt(t, 2.1, seed * 0.13);
			apply({y: -flap * 26, rot: -8 + Math.sin(t * 1.1) * 6});
			break;
		case 'window':
			glow += acc * 0.3;
			if (shot.accent !== undefined) {
				under = <WindowRays size={size} h={h} t={t} strength={0.45 + accStep * 0.55} />;
			}
			break;
	}

	if (pose.opacity <= 0.001) {
		return null;
	}
	// Screen-blended halos blow out on the bright dawn sky, so they ease off there.
	glow = Math.min(1, glow) * (1 - 0.45 * dawnAt(t, period));

	const cx = shot.x ?? 540;
	return (
		<AbsoluteFill style={{opacity: Math.max(0, Math.min(1, pose.opacity))}}>
			<div
				style={{
					position: 'absolute',
					left: cx - size / 2,
					top: shot.y - h / 2,
					width: size,
					height: h,
					transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot + flip}deg) scale(${pose.scale})`,
				}}
			>
				{under}
				<Glow n={shot.asset} width={size} opacity={glow} />
				{shot.motion === 'butterfly' ? (
					<FlappingButterfly width={size} flap={flap} />
				) : (
					<Art n={shot.asset} width={size} chroma={pose.chroma} glitch={pose.glitch} seed={frame} />
				)}
				{extra}
			</div>
		</AbsoluteFill>
	);
};

/** Glitter trickling through the hourglass neck. */
const SandStream: React.FC<{width: number; height: number; t: number; visible: number}> = ({width, height, t, visible}) => {
	if (visible <= 0) {
		return null;
	}
	// neck of assets/8.png sits at ~(561, 745) on a 1122x1402 canvas
	const nx = width * 0.5;
	const top = height * 0.53;
	const len = height * 0.2;
	return (
		<div style={{position: 'absolute', inset: 0, opacity: visible, zIndex: 2}}>
			{new Array(16).fill(0).map((_, i) => {
				const p = (t * 0.9 + i / 16) % 1;
				const s = 3 + random(`sand${i}`) * 4;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: nx - s / 2 + Math.sin(i * 7.3 + t * 3) * 3,
							top: top + p * len,
							width: s,
							height: s,
							borderRadius: '50%',
							background: '#fff',
							opacity: Math.sin(p * Math.PI),
							boxShadow: `0 0 ${s * 3}px ${s}px rgba(247,205,209,0.8)`,
						}}
					/>
				);
			})}
		</div>
	);
};

/** Rose-gold rings spreading out where the tear lands. */
const Ripples: React.FC<{width: number; height: number; since: number}> = ({width, height, since}) => (
	<>
		{[0, 0.45, 0.9].map((delay, i) => {
			const p = (since - delay) / 1.8;
			if (p < 0 || p > 1) {
				return null;
			}
			const w = width * (0.3 + p * 2.2);
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: width / 2 - w / 2,
						top: height * 0.98 - w * 0.12,
						width: w,
						height: w * 0.24,
						borderRadius: '50%',
						border: `${3 - p * 2}px solid ${palette.roseGold}`,
						boxShadow: `0 0 24px ${palette.orchid}, inset 0 0 18px ${palette.lilac}`,
						opacity: (1 - p) * 0.9,
					}}
				/>
			);
		})}
	</>
);

/** Long cross-shaped lens flare for the star. */
const Flare: React.FC<{size: number; t: number; boost: number}> = ({size, t, boost}) => {
	const s = size * (1.5 + boost * 0.6);
	const a = Math.min(0.85, 0.3 + boost * 0.4);
	return (
		<div
			style={{
				position: 'absolute',
				left: size / 2 - s / 2,
				top: size / 2 - s / 2,
				width: s,
				height: s,
				opacity: a,
				mixBlendMode: 'screen',
				transform: `rotate(${-t * 16 + 45}deg)`,
			}}
		>
			<div style={{position: 'absolute', left: 0, top: s / 2 - 3, width: s, height: 6, borderRadius: 6, background: 'linear-gradient(90deg, transparent, rgba(255,246,250,0.95), transparent)'}} />
			<div style={{position: 'absolute', top: 0, left: s / 2 - 3, height: s, width: 6, borderRadius: 6, background: 'linear-gradient(180deg, transparent, rgba(255,246,250,0.95), transparent)'}} />
			<div
				style={{
					position: 'absolute',
					left: s / 2 - size * 0.25,
					top: s / 2 - size * 0.25,
					width: size * 0.5,
					height: size * 0.5,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(247,205,209,0.35) 35%, transparent 70%)',
				}}
			/>
		</div>
	);
};

/** Soft god-rays pouring out of the window. */
const WindowRays: React.FC<{size: number; h: number; t: number; strength: number}> = ({size, h, t, strength}) => {
	const s = size * 2.6;
	return (
		<div
			style={{
				position: 'absolute',
				left: size / 2 - s / 2,
				top: h * 0.45 - s / 2,
				width: s,
				height: s,
				borderRadius: '50%',
				opacity: strength * 0.55,
				mixBlendMode: 'screen',
				transform: `rotate(${t * 6}deg)`,
				background:
					'repeating-conic-gradient(from 0deg, rgba(255,233,214,0.55) 0deg 6deg, rgba(255,233,214,0) 6deg 18deg)',
				WebkitMaskImage: 'radial-gradient(circle, black 0%, rgba(0,0,0,0.6) 30%, transparent 68%)',
				maskImage: 'radial-gradient(circle, black 0%, rgba(0,0,0,0.6) 30%, transparent 68%)',
			}}
		/>
	);
};
