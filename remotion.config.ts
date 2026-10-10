import {Config} from '@remotion/cli/config';

// TikTok-friendly output: H.264, yuv420p, high quality.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(20);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);
