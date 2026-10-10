import React from 'react';
import {Composition} from 'remotion';
import {MV} from './MV';
import {DURATION_FRAMES} from './lib/loop';
import {FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
	<Composition id="MV" component={MV} durationInFrames={DURATION_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
