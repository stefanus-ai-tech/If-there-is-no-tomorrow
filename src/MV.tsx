import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile} from 'remotion';
import {CloudWipe, FarClouds, NearClouds} from './components/Clouds';
import {Flash, Grain, LightLeaks, Vignette} from './components/Grade';
import {Hero} from './components/Hero';
import {Lyrics} from './components/Lyrics';
import {Bokeh, Glitter, Twinkles} from './components/Particles';
import {Sky} from './components/Sky';
import {Swarm} from './components/Swarm';
import {LoopWindow, Title} from './components/Title';
import {waitForFonts} from './lib/fonts';
import {DROP, lineStart, montage, montageShots, OUTRO, shots, TITLE_CARD} from './lib/timeline';
import {palette} from './theme';

const SKY_WIPE = shots[6].from;

const FLASHES = [
	{at: DROP, strength: 0.85},
	{at: lineStart(12), strength: 0.3},
	{at: shots[12].accent ?? lineStart(12), strength: 0.4},
	{at: lineStart(14), strength: 0.25},
	{at: OUTRO, strength: 0.45},
	...montage.slice(1).map((m) => ({at: m.at, strength: 0.28})),
	{at: TITLE_CARD, strength: 0.75},
];

const FLIGHTS = [
	{at: DROP + 0.1, duration: 4.5, count: 9, seed: 'drop'},
	{at: OUTRO, duration: 4.5, count: 10, seed: 'outro'},
	{at: TITLE_CARD + 0.3, duration: 6, count: 6, seed: 'card'},
	{at: TITLE_CARD + 7, duration: 8, count: 5, seed: 'fade'},
];

export const MV: React.FC = () => {
	waitForFonts();
	return (
		<AbsoluteFill style={{backgroundColor: palette.dusk}}>
			<Html5Audio src={staticFile('song.mp3')} />
			<SkyLayers />
			{shots.map((shot, i) => (
				<Hero key={`s${i}`} shot={shot} seed={i} />
			))}
			{montageShots.map((shot, i) => (
				<Hero key={`m${i}`} shot={shot} seed={20 + i} />
			))}
			<LoopWindow />
			<Swarm flights={FLIGHTS} />
			<Title />
			<NearClouds />
			<Glitter />
			<Lyrics />
			<Bokeh near count={5} seed="near" />
			<CloudWipe at={SKY_WIPE} />
			<CloudWipe at={TITLE_CARD - 0.15} duration={1.1} />
			<LightLeaks />
			<Flash hits={FLASHES} />
			<Vignette />
			<Grain />
		</AbsoluteFill>
	);
};

const SkyLayers: React.FC = () => (
	<>
		<Sky />
		<Twinkles />
		<FarClouds />
		<Bokeh count={14} seed="far" />
	</>
);
