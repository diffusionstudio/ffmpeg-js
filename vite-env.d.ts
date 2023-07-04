/// <reference types="vite/client" />
import { FFmpeg } from './src/ffmpeg.ts';

declare global {
  var ffmpeg: FFmpeg;
}
