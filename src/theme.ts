import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/pinyon-script/latin-400.css';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Sampled from the artwork (k-means over the opaque pixels of assets/1-10).
export const palette = {
	pearl: '#FFF6FA',
	blush: '#FAE8EB',
	petal: '#F7CDD1',
	orchid: '#E9ADD1',
	lilac: '#EBC4EA',
	lavender: '#CFA4E3',
	mauve: '#CA8EC1',
	roseGold: '#E8ADAE',
	roseGoldDeep: '#D18D95',
	plum: '#AA6B90',
	periwinkle: '#9680D0',
	peach: '#FFD9C0',
	dusk: '#2A1B47',
	deepPlum: '#3B2150',
} as const;

export const fonts = {
	serif: '"Cormorant Garamond", "Times New Roman", serif',
	script: '"Pinyon Script", "Cormorant Garamond", cursive',
} as const;

// TikTok UI covers the top bar, the right-hand action rail and the caption
// block at the bottom, so lyrics and focal points stay inside this box.
export const safe = {
	top: 220,
	bottom: 1540,
	left: 90,
	right: 930,
	centerX: 510,
} as const;
