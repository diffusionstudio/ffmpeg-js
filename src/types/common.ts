import configs from '../ffmpeg-config';

/**
 * Defines a callback function that
 * gets triggered by an event
 */
export type EventCallback = () => void;

/**
 * Defines a callback function that
 * gets called when ffmpeg logs a message
 */
export type MessageCallback = (msg: string) => void;

/**
 * Defines a callback function that
 * gets called during rendering when a number
 * of frames has been rendered
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Defines encoder and decoder records that
 * contain the supported formats
 */
export type EncoderDecoderRecords = {
  encoders: Record<string, string>;
  decoders: Record<string, string>;
};

/**
 * Defines the supported formats that ffmpeg
 * has been compiled with.
 */
export interface SupportedFormats {
  muxers: Record<string, string>;
  demuxers: Record<string, string>;
}

/**
 * Defines the supported video and audio
 * encoders and decoders that ffmpeg has been
 * compiled with.
 */
export interface SupportedCodecs {
  /**
   * Video encoders and decoders dictionary
   */
  video: EncoderDecoderRecords;
  /**
   * Audio encoders and decoders dictionary
   */
  audio: EncoderDecoderRecords;
}

/**
 * Defines the available constructor options
 */
export type FFmpegSettings = {
  /**
   * Choose a custom ffmpeg binary location
   * @example
   * new URL("/dist/ffmpeg-core.js", import.meta.url).href;
   * // this will retrieve the file from a local location
   */
  source?: string;
  /**
   * Choose which ffmpeg wasm configuration to use.
   * **MAKE SURE YOU SELECT THE LICENSE THAT YOU CAN**
   * **COMPLY WITH**, checkout https://ffmpeg.org/legal.html
   * for more.
   */
  config?: keyof typeof configs;
  /**
   * Choose whether ffmpeg should log each output
   */
  log?: boolean;
};

/**
 * Defines the available constructor options
 */
export type FFmpegBaseSettings = {
  /**
   * Overwrite the logging function.
   */
  logger(msg?: any, ...params: any[]): void;
  /**
   * Choose a custom ffmpeg binary location
   */
  source: string;
};

/**
 * Defines the locations of the wasm module
 */
export type WasmModuleURIs = {
  /**
   * `ffmpeg-core.js` path
   */
  core: string;
  /**
   * `ffmpeg-core.wasm` path
   */
  wasm: string;
  /**
   * `ffmpeg-core.worker.js` path
   */
  worker: string;
};
