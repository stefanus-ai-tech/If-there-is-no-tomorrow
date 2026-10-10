import {Easing, interpolate} from 'remotion';
import rawLyrics from '../data/lyrics.json';
import {audio} from './audio';

export type Word = {text: string; start: number; end: number};
export type Line = {text: string; words: Word[]};

export const lines = rawLyrics as Line[];

export const lineStart = (i: number) => lines[i].words[0].start;
export const lineEnd = (i: number) => lines[i].words[lines[i].words.length - 1].end;
export const LAST_VOCAL = lineEnd(lines.length - 1);

/** The word in each line that gets the big script treatment. */
export const KEYWORDS: Record<number, string> = {
	0: 'myself',
	1: 'worse',
	2: 'knows',
	3: 'gone',
	4: 'fair',
	5: 'there',
	6: 'sky',
	7: 'be',
	8: 'butterfly',
	9: 'star',
	10: 'best',
	11: 'flow',
	12: 'tomorrow',
	13: 'borrow',
	14: "doin'",
	15: 'forgiven',
};

export type Motion =
	| 'window'
	| 'heart'
	| 'swirl'
	| 'hourglass'
	| 'tear'
	| 'moon'
	| 'clouds'
	| 'star'
	| 'butterfly';

export type Enter = 'bloom' | 'rise' | 'fall' | 'spin' | 'fly' | 'zoom' | 'glitch' | 'far';
export type Exit = 'lift' | 'through' | 'drop' | 'dissolve' | 'glitch';

export type Shot = {
	asset: number;
	motion: Motion;
	from: number; // seconds
	to: number;
	size: number; // rendered width in px
	y: number; // vertical centre in px
	x?: number;
	enter: Enter;
	exit: Exit;
	/** Time of an extra accent inside the shot (flip, crack glow, ...). */
	accent?: number;
};

/** Snap a time to the closest detected kick (within `range` seconds). */
export const nearestKick = (t: number, range = 0.35) => {
	let best = t;
	let dist = range;
	for (const [k] of audio.kicks) {
		if (Math.abs(k - t) < dist) {
			dist = Math.abs(k - t);
			best = k;
		}
	}
	return best;
};

const LEAD = 0.55; // a shot starts slightly before its line is sung

const s = (line: number) => lineStart(line) - LEAD;
const word = (line: number, text: string) =>
	lines[line].words.find((w) => w.text.toLowerCase().startsWith(text.toLowerCase()))?.start ?? lineStart(line);

export const HERO_Y = 700;

export const OUTRO = LAST_VOCAL + 0.5;
/** First chorus hit, locked to the kick under "A flying butterfly". */
export const DROP = nearestKick(lineStart(8));

// One hero artwork per lyric line: a new focal point every 2-6 s keeps the
// eye moving without ever feeling cut-y.
export const shots: Shot[] = [
	{asset: 9, motion: 'window', from: 0, to: s(1), size: 640, y: HERO_Y + 40, enter: 'zoom', exit: 'through'},
	{asset: 7, motion: 'heart', from: s(1), to: s(2), size: 620, y: HERO_Y, enter: 'bloom', exit: 'lift', accent: word(1, 'worse')},
	{asset: 5, motion: 'swirl', from: s(2), to: s(3), size: 860, y: HERO_Y, enter: 'rise', exit: 'dissolve', accent: word(2, 'knows')},
	{asset: 8, motion: 'hourglass', from: s(3), to: s(4), size: 520, y: HERO_Y, enter: 'bloom', exit: 'lift', accent: word(3, 'gone')},
	{asset: 6, motion: 'tear', from: s(4), to: s(5), size: 440, y: HERO_Y, enter: 'fall', exit: 'drop', accent: word(4, 'fair')},
	{asset: 3, motion: 'moon', from: s(5), to: s(6), size: 640, y: HERO_Y, enter: 'far', exit: 'lift'},
	{asset: 4, motion: 'clouds', from: s(6), to: s(7), size: 900, y: HERO_Y + 40, enter: 'rise', exit: 'through', accent: word(6, 'sky')},
	{asset: 2, motion: 'star', from: s(7), to: DROP, size: 300, y: HERO_Y, enter: 'far', exit: 'through'},
	{asset: 1, motion: 'butterfly', from: DROP - 0.15, to: s(9), size: 700, y: HERO_Y, enter: 'fly', exit: 'lift'},
	{asset: 2, motion: 'star', from: s(9), to: s(10), size: 640, y: HERO_Y, enter: 'spin', exit: 'lift', accent: word(9, 'star')},
	{asset: 9, motion: 'window', from: s(10), to: s(11), size: 600, y: HERO_Y, enter: 'bloom', exit: 'through', accent: word(10, 'best')},
	{asset: 5, motion: 'swirl', from: s(11), to: s(12), size: 900, y: HERO_Y, enter: 'rise', exit: 'dissolve', accent: word(11, 'flow')},
	{asset: 8, motion: 'hourglass', from: s(12), to: s(13), size: 540, y: HERO_Y, enter: 'zoom', exit: 'lift', accent: word(12, 'tomorrow')},
	{asset: 3, motion: 'moon', from: s(13), to: s(14), size: 660, y: HERO_Y, enter: 'spin', exit: 'lift', accent: word(13, 'borrow')},
	{asset: 7, motion: 'heart', from: s(14), to: s(15), size: 620, y: HERO_Y, enter: 'glitch', exit: 'glitch', accent: word(14, 'sinful')},
	{asset: 6, motion: 'tear', from: s(15), to: OUTRO, size: 460, y: HERO_Y, enter: 'fall', exit: 'dissolve', accent: word(15, 'forgiven')},
];

/** Kick-synced montage after the last line: every artwork gets a beat. */
export const montage: {asset: number; at: number}[] = [
	{asset: 1, at: OUTRO},
	{asset: 2, at: nearestKick(86.5)},
	{asset: 3, at: nearestKick(87.6)},
	{asset: 7, at: nearestKick(89.3)},
	{asset: 8, at: nearestKick(91.9)},
	{asset: 5, at: nearestKick(94.3)},
];
export const TITLE_CARD = nearestKick(95.5);

type Key = [number, number];
const curve = (keys: Key[], t: number) =>
	interpolate(
		t,
		keys.map((k) => k[0]),
		keys.map((k) => k[1]),
		{extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)},
	);

/**
 * 0 = dusk (deep plum night), 1 = dawn (bright pastel sky).
 * Verse stays in dusk, the pre-chorus dips darker, the chorus bursts into
 * dawn, "sinful" clouds over, "forgiven" glows, and the outro sinks back to
 * dusk by `end` so the last frame matches the first one for a seamless loop.
 */
export const dawnAt = (t: number, end: number) =>
	curve(
		[
			[0, 0.16],
			[12, 0.2],
			[32, 0.3],
			[39, 0.48],
			[41, 0.22],
			[DROP - 0.1, 0.06],
			[DROP + 0.5, 1],
			[61, 0.92],
			[lineStart(14) - 0.6, 0.9],
			[lineStart(14), 0.5],
			[lineEnd(14), 0.45],
			[lineStart(15), 0.7],
			[LAST_VOCAL, 1],
			[TITLE_CARD, 0.85],
			...((end - 10 > TITLE_CARD + 1 ? [[end - 10, 0.35], [end - 2, 0.16]] : [[end - 0.5, 0.16]]) as Key[]),
		],
		t,
	);

/** Vertical camera tilt of the sky plate in px (positive = look up). */
export const tiltAt = (t: number, end: number) =>
	curve(
		[
			[0, 0],
			[s(6), 0],
			[lineEnd(6), 190],
			[lineStart(7) + 1, 120],
			[DROP, 0],
			[61, -60],
			[OUTRO, 80],
			[Math.min(104, end - 1), 0],
		],
		t,
	);

const MONTAGE_STYLE: Record<number, Pick<Shot, 'motion' | 'enter' | 'size'>> = {
	1: {motion: 'butterfly', enter: 'fly', size: 760},
	2: {motion: 'star', enter: 'spin', size: 700},
	3: {motion: 'moon', enter: 'zoom', size: 720},
	5: {motion: 'swirl', enter: 'rise', size: 920},
	7: {motion: 'heart', enter: 'glitch', size: 700},
	8: {motion: 'hourglass', enter: 'bloom', size: 600},
};

/** The outro montage expressed as regular shots, one per kick. */
export const montageShots: Shot[] = montage.map((m, i) => ({
	asset: m.asset,
	...MONTAGE_STYLE[m.asset],
	from: m.at,
	to: i < montage.length - 1 ? montage[i + 1].at : TITLE_CARD,
	y: 860,
	exit: i < montage.length - 1 ? 'dissolve' : 'through',
	accent: m.asset === 8 ? m.at + 0.6 : undefined,
}));
