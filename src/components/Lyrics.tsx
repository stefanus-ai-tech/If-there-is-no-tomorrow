import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {vocalAt} from '../lib/audio';
import {usePeriod} from '../lib/loop';
import {dawnAt, KEYWORDS, lineEnd, lines, type Line} from '../lib/timeline';
import {fonts, palette, safe} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const BLOCK_TOP = 1090;
const BLOCK_H = 420;
const BLOCK_W = 820;
const WORD_LEAD = 0.08; // eyes react a touch later than ears
const MIN_STAGGER = 0.07;

/** Lines that flash one huge word at a time instead of building up. */
const SINGLE_WORD_LINES = new Set([7]);

/** Typographic apostrophes read much better in the script face. */
const display = (text: string) => text.replace(/'/g, '\u2019');

/** Pinyon's apostrophe floats a line too high, so borrow the serif one. */
const scriptText = (text: string) =>
	text.split(/(')/).map((part, i) =>
		part === "'" ? (
			<span key={i} style={{fontFamily: fonts.serif, fontStyle: 'italic', fontSize: '0.5em', verticalAlign: '0.6em', marginLeft: '0.02em'}}>
				{'\u2019'}
			</span>
		) : (
			part
		),
	);

const revealTimes = (line: Line) => {
	const out: number[] = [];
	line.words.forEach((w, i) => {
		const at = w.start - WORD_LEAD;
		out.push(i === 0 ? at : Math.max(at, out[i - 1] + MIN_STAGGER));
	});
	return out;
};

const lineWindow = (i: number) => {
	const show = lines[i].words[0].start - 0.3;
	const next = i < lines.length - 1 ? lines[i + 1].words[0].start - 0.28 : Infinity;
	const hide = Math.min(next, lineEnd(i) + (i === lines.length - 1 ? 1.4 : 2.4));
	return {show, hide};
};

const bodyShadow = (a: number) =>
	[
		'0 0 3px rgba(59,33,80,0.85)',
		'0 1px 2px rgba(42,27,71,0.7)',
		`0 0 ${12 + 14 * a}px rgba(233,173,209,${0.5 + 0.4 * a})`,
		`0 0 ${30 + 24 * a}px rgba(150,128,208,${0.42 + 0.25 * a})`,
		'0 3px 14px rgba(42,27,71,0.6)',
	].join(', ');

const BodyWord: React.FC<{text: string; at: number; start: number; end: number; size: number}> = ({text, at, start, end, size}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const p = spring({frame: frame - at * fps, fps, config: {damping: 17, mass: 0.7, stiffness: 120}});
	const fade = interpolate(frame - at * fps, [0, 0.3 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	if (fade <= 0.001) {
		return (
			<span style={{display: 'inline-block', opacity: 0, fontFamily: fonts.serif, fontStyle: 'italic', fontWeight: 600, fontSize: size, lineHeight: 1.08, margin: '0 0.14em'}}>
				{display(text)}
			</span>
		);
	}
	const active = interpolate(t, [start - 0.05, start + 0.12, end, end + 0.4], [0, 1, 1, 0], clamp);
	return (
		<span
			style={{
				display: 'inline-block',
				margin: '0 0.14em',
				fontFamily: fonts.serif,
				fontStyle: 'italic',
				fontWeight: 600,
				fontSize: size,
				lineHeight: 1.08,
				color: palette.pearl,
				opacity: fade,
				transform: `translateY(${(1 - p) * 34 - active * 4}px) scale(${0.93 + 0.07 * p + active * 0.03})`,
				filter: fade < 1 ? `blur(${(1 - fade) * 9}px)` : undefined,
				textShadow: bodyShadow(active),
			}}
		>
			{display(text)}
		</span>
	);
};

/** Little four-point stars that burst out of a keyword as it lands. */
const Burst: React.FC<{since: number; seed: string; spread: number}> = ({since, seed, spread}) => {
	if (since < 0 || since > 1.2) {
		return null;
	}
	const p = Easing.out(Easing.cubic)(since / 1.2);
	return (
		<div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0}}>
			{new Array(12).fill(0).map((_, i) => {
				const ang = (i / 12) * Math.PI * 2 + random(`${seed}a${i}`) * 0.5;
				const dist = (0.35 + random(`${seed}d${i}`) * 0.65) * spread * p;
				const s = 10 + random(`${seed}s${i}`) * 16;
				return (
					<svg
						key={i}
						width={s * 2}
						height={s * 2}
						viewBox="-1 -1 2 2"
						style={{
							position: 'absolute',
							left: Math.cos(ang) * dist * 1.5 - s,
							top: Math.sin(ang) * dist * 0.55 - s,
							opacity: (1 - p) * 0.95,
							transform: `rotate(${p * 90}deg) scale(${1 - p * 0.5})`,
							overflow: 'visible',
						}}
					>
						<path
							d="M0,-1 C0.08,-0.08 0.08,-0.08 1,0 C0.08,0.08 0.08,0.08 0,1 C-0.08,0.08 -0.08,0.08 -1,0 C-0.08,-0.08 -0.08,-0.08 0,-1 Z"
							fill="#fff"
						/>
					</svg>
				);
			})}
		</div>
	);
};

const KeyWord: React.FC<{text: string; at: number; start: number; end: number; size: number; seed: string}> = ({
	text,
	at,
	start,
	end,
	size,
	seed,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const p = spring({frame: frame - at * fps, fps, config: {damping: 15, mass: 0.85, stiffness: 100}});
	const fade = interpolate(frame - at * fps, [0, 0.4 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const sustain = interpolate(t, [start, start + 0.2, end, end + 0.6], [0, 1, 1, 0], clamp);
	const vocal = Math.min(1, vocalAt(frame)) * sustain;
	const shimmer = ((t - start) * 0.45) % 1;
	const visible = fade > 0.001;
	return (
		<div style={{position: 'relative', display: 'flex', justifyContent: 'center', marginTop: -size * 0.12}}>
			<Burst since={t - start} seed={seed} spread={size * 2.1} />
			<span
				style={{
					display: 'inline-block',
					fontFamily: fonts.script,
					fontSize: size,
					lineHeight: 1.25,
					padding: '0.08em 0.32em 0.16em',
					whiteSpace: 'nowrap',
					opacity: visible ? fade : 0,
					letterSpacing: `${(1 - fade) * 0.22}em`,
					transform: `translateY(${(1 - p) * 26}px) scale(${1.32 - 0.32 * p + vocal * 0.05})`,
					backgroundImage: `linear-gradient(100deg, #ffffff 0%, ${palette.pearl} 22%, ${palette.lilac} 38%, #ffffff 52%, ${palette.petal} 66%, ${palette.pearl} 82%, #ffffff 100%)`,
					backgroundSize: '220% 100%',
					backgroundPosition: `${100 - shimmer * 100}% 50%`,
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					WebkitTextFillColor: 'transparent',
					filter: [
						fade < 1 ? `blur(${(1 - fade) * 12}px)` : '',
						'drop-shadow(0 0 2px rgba(59,33,80,1))',
						'drop-shadow(0 3px 6px rgba(42,27,71,0.55))',
						`drop-shadow(0 0 ${8 + vocal * 9}px rgba(233,173,209,${0.7 + vocal * 0.3}))`,
						`drop-shadow(0 0 ${22 + vocal * 12}px rgba(150,128,208,0.6))`,
					].join(' '),
				}}
			>
				{scriptText(text)}
			</span>
		</div>
	);
};

const LyricLine: React.FC<{index: number}> = ({index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const line = lines[index];
	const {show, hide} = lineWindow(index);
	if (t < show - 0.2 || t > hide + 0.6) {
		return null;
	}
	const reveal = revealTimes(line);
	const out = interpolate(t, [hide, hide + 0.45], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const keyword = KEYWORDS[index];
	const kwIndex = line.words.findIndex((w) => w.text === keyword);

	let content: React.ReactNode;
	if (SINGLE_WORD_LINES.has(index)) {
		// one big word at a time: "And" / "will" / "I" / "be"
		let current = 0;
		reveal.forEach((r, i) => {
			if (t >= r) {
				current = i;
			}
		});
		content = line.words.map((w, i) => {
			const nextAt = reveal[i + 1];
			const gone = nextAt === undefined ? 0 : interpolate(t, [nextAt - 0.05, nextAt + 0.2], [0, 1], clamp);
			if (i !== current && !(i === current - 1 && gone < 1)) {
				return null;
			}
			const isKey = i === kwIndex;
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: 1 - gone,
						transform: `translateY(${-gone * 60}px) scale(${1 + gone * 0.15})`,
					}}
				>
					{isKey ? (
						<KeyWord text={w.text} at={reveal[i]} start={w.start} end={w.end} size={230} seed={`k${index}`} />
					) : (
						<BodyWord text={w.text} at={reveal[i]} start={w.start} end={w.end} size={150} />
					)}
				</div>
			);
		});
	} else {
		const indexed = line.words.map((w, i) => ({w, i}));
		const before = indexed.filter(({i}) => kwIndex < 0 || i < kwIndex);
		const after = kwIndex < 0 ? [] : indexed.filter(({i}) => i > kwIndex);
		const kw = kwIndex >= 0 ? line.words[kwIndex] : null;
		const long = line.text.length > 24;
		const bodySize = long ? 88 : 98;
		const kwSize = kw && kw.text.length > 7 ? 160 : 182;
		const row = (words: typeof indexed) =>
			words.length ? (
				<div style={{maxWidth: BLOCK_W, textAlign: 'center', textWrap: 'balance'}}>
					{words.map(({w, i}) => (
						<BodyWord key={i} text={w.text} at={reveal[i]} start={w.start} end={w.end} size={bodySize} />
					))}
				</div>
			) : null;
		content = (
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
				{row(before)}
				{kw ? (
					<KeyWord text={kw.text} at={reveal[kwIndex]} start={kw.start} end={kw.end} size={kwSize} seed={`k${index}`} />
				) : null}
				{after.length ? <div style={{marginTop: -bodySize * 0.18}}>{row(after)}</div> : null}
			</div>
		);
	}

	return (
		<AbsoluteFill
			style={{
				opacity: 1 - out,
				transform: `translateY(${-out * 54}px)`,
				filter: out > 0.01 ? `blur(${out * 10}px)` : undefined,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: safe.centerX - BLOCK_W / 2,
					top: BLOCK_TOP,
					width: BLOCK_W,
					height: BLOCK_H,
				}}
			>
				{content}
			</div>
		</AbsoluteFill>
	);
};

/** How much of the lyric block is on screen right now (0..1). */
const presence = (t: number) => {
	let v = 0;
	lines.forEach((line, i) => {
		const {hide} = lineWindow(i);
		const first = revealTimes(line)[0];
		const inn = interpolate(t, [first - 0.15, first + 0.35], [0, 1], clamp);
		const out = interpolate(t, [hide, hide + 0.45], [1, 0], clamp);
		v = Math.max(v, Math.min(inn, out));
	});
	return v;
};

/**
 * One soft mauve bed (multiplied, so it deepens the sky instead of greying
 * it) that keeps the pearl lyrics readable on the bright dawn sections.
 */
const LyricBed: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const period = usePeriod();
	const t = frame / fps;
	const p = presence(t);
	if (p <= 0.001) {
		return null;
	}
	const dawn = dawnAt(t, period);
	return (
		<div
			style={{
				position: 'absolute',
				left: safe.centerX - 680,
				top: BLOCK_TOP - 220,
				width: 1360,
				height: BLOCK_H + 440,
				opacity: p * (0.35 + 0.65 * dawn),
				mixBlendMode: 'multiply',
				background:
					'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(140,88,142,0.82) 0%, rgba(170,107,144,0.45) 42%, rgba(202,142,193,0.15) 62%, rgba(202,142,193,0) 76%)',
			}}
		/>
	);
};

export const Lyrics: React.FC = () => (
	<AbsoluteFill>
		<LyricBed />
		{lines.map((_, i) => (
			<LyricLine key={i} index={i} />
		))}
	</AbsoluteFill>
);
