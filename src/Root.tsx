import React from 'react';
import {Composition} from 'remotion';
import {MV} from './MV';
import {FULL_END, framesFor, TIKTOK_END} from './lib/loop';
import {FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
	<>
		{/* Recommended upload: ends as the outro fades, then loops. */}
		<Composition id="MV-TikTok" component={MV} durationInFrames={framesFor(TIKTOK_END)} fps={FPS} width={WIDTH} height={HEIGHT} />
		{/* The whole song, 1:54. */}
		<Composition id="MV-Full" component={MV} durationInFrames={framesFor(FULL_END)} fps={FPS} width={WIDTH} height={HEIGHT} />
	</>
);
