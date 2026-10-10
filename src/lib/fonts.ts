import {continueRender, delayRender} from 'remotion';

let loaded = false;

// Block rendering until the bundled webfonts are ready so no frame is drawn
// with a fallback font.
export const waitForFonts = () => {
	if (loaded || typeof document === 'undefined') {
		return;
	}
	loaded = true;
	const handle = delayRender('Loading fonts');
	Promise.all([
		document.fonts.load('italic 500 80px "Cormorant Garamond"'),
		document.fonts.load('italic 600 80px "Cormorant Garamond"'),
		document.fonts.load('600 40px "Cormorant Garamond"'),
		document.fonts.load('400 120px "Pinyon Script"'),
	])
		.then(() => document.fonts.ready)
		.then(() => continueRender(handle))
		.catch((err) => {
			console.error(err);
			continueRender(handle);
		});
};
