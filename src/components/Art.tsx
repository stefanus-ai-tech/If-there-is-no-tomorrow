import React from 'react';
import {Img, random, staticFile} from 'remotion';

export const ASPECT: Record<number, number> = {
	1: 1,
	2: 1,
	3: 1,
	4: 1,
	5: 1,
	6: 1,
	7: 1,
	8: 1402 / 1122,
	9: 1402 / 1122,
	10: 724 / 2172,
};

export const artSrc = (n: number) => staticFile(`assets/${n}.png`);
export const glowSrc = (n: number) => staticFile(`fx/glow-${n}.png`);

const chromaFilter = (c: number) =>
	c > 0.4
		? `drop-shadow(${c}px 0 0 rgba(255,70,190,0.55)) drop-shadow(${-c}px 0 0 rgba(90,205,255,0.5))`
		: undefined;

/**
 * One artwork with optional chromatic split and slice-glitch (the song is
 * tagged glitchy indietronica, so the glitches stay short and pastel).
 */
export const Art: React.FC<{
	n: number;
	width: number;
	chroma?: number;
	glitch?: number;
	seed?: number;
	style?: React.CSSProperties;
}> = ({n, width, chroma = 0, glitch = 0, seed = 0, style}) => {
	const height = width * ASPECT[n];
	const filter = chromaFilter(chroma);
	if (glitch < 0.05) {
		return <Img src={artSrc(n)} style={{width, height, display: 'block', filter, ...style}} />;
	}
	const slices = 6;
	return (
		<div style={{position: 'relative', width, height, ...style}}>
			{new Array(slices).fill(0).map((_, i) => {
				const r = random(`slice${seed}-${i}`);
				const shift = (r - 0.5) * 2 * glitch * 70 * (r > 0.35 ? 1 : 0.15);
				return (
					<Img
						key={i}
						src={artSrc(n)}
						style={{
							position: 'absolute',
							inset: 0,
							width,
							height,
							clipPath: `inset(${(i / slices) * 100}% 0 ${100 - ((i + 1) / slices) * 100}% 0)`,
							transform: `translateX(${shift}px)`,
							filter: chromaFilter(Math.max(chroma, glitch * 10)),
						}}
					/>
				);
			})}
		</div>
	);
};

/** Pre-blurred halo that sits behind an artwork. */
export const Glow: React.FC<{n: number; width: number; opacity: number}> = ({n, width, opacity}) => {
	// glow textures are a thumbnail fitted into 420x420, padded by 90px
	const a = ASPECT[n];
	const tw = a >= 1 ? 420 / a : 420;
	const th = a >= 1 ? 420 : 420 * a;
	const k = width / tw;
	const w = (tw + 180) * k;
	const h = (th + 180) * k;
	return (
		<Img
			src={glowSrc(n)}
			style={{
				position: 'absolute',
				left: (width - w) / 2,
				top: (width * ASPECT[n] - h) / 2,
				width: w,
				height: h,
				opacity,
				mixBlendMode: 'screen',
			}}
		/>
	);
};
