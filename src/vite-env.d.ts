/// <reference types="vite/client" />
import { FFmpeg } from './ffmpeg.ts';

declare global {
  var ffmpeg: FFmpeg;
}
