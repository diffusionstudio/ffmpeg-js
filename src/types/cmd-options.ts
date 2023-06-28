import { IFFmpegConfiguration } from '../interfaces';

/**
 * Defines the available audio output options
 */
export type AudioOutputOptions<AudioCodecExtension> = {
  /**
   * A string containing a valid audio encoder string. Get the supported
   * codecs with `ffmpeg.codecs()`. Use `"copy"` to use the input codec.
   * @example "aac"
   */
  codec: 'copy' | AudioCodecExtension;
  /**
   * An integer representing the number of frame
   * samples per second (Hz).
   * @example 44100 // Hz
   */
  sampleRate?: number;
  /**
   * An integer representing the number of audio channels.
   * @example 2 // stereo
   */
  numberOfChannels?: number;
  /**
   * An integer containing the average bitrate of the encoded
   * audio in units of bits per second.
   * @example 128_000, // 128 kbps
   */
  bitrate?: number;
  /**
   * A number setting the volume of the output (256=normal).
   */
  volume?: number;
};

export type DisabledAudioOutput = {
  /**
   * Disable all audio tracks.
   */
  disableAudio: boolean;
};

/**
 * Defines the available video output options
 */
export type VideoOutputOptions<VideoCodecExtension> = {
  /**
   * A string containing a valid video encoder string. Get the supported
   * codecs with `ffmpeg.codecs()`. Use `"copy"` to use the input codec.
   * @example "h263"
   */
  codec: 'copy' | VideoCodecExtension;
  /**
   * A number repersenting the framerate
   * @example 30 // fps
   */
  framerate?: number;
  /**
   * A number containing the aspect ratio of the video
   * @example 16/9 // 16:9
   */
  aspectRatio?: number;
  /**
   * With and height as numbers defining the video output size
   * @example { width: 1920, height: 1080}
   */
  size?: { width: number; height: number };
  /**
   * An integer containing the average bitrate of the encoded
   * audio in units of bits per second.
   * @example 2_000_000, // 2 Mbps
   */
  bitrate?: number;
};

export type DisabledVideoOutput = {
  /**
   * Disable all video tracks.
   */
  disableVideo: boolean;
};

/**
 * Defines an image/ image sequence imput
 */
export interface ImageOptions {
  /**
   * Accepted Formats:
   * - A URL such as one created with `URL.createObjectURL()`
   * - A Blob that you can get from the `File API`
   * - A File path that you have used for the `ffmpeg.writeFile()` method
   */
  sequence: (string | Blob)[];
  /**
   * If you're using a image sequence, use this parameter
   * to specify the input framerate
   */
  framerate: number;
}

/**
 * Defines an audio / video input
 */
export interface MediaOptions {
  /**
   * Accepted Formats:
   * - A URL such as one created with `URL.createObjectURL()`
   * - A Blob that you can get from the `File API`
   * - A File path that you have used for the `ffmpeg.writeFile()` method
   */
  source: string | Blob;
  /**
   * Time offset in seconds from the start of the input
   */
  seek?: number;
}

/**
 * Defines how the input is structured
 */
export type InputOptions = ImageOptions | MediaOptions;

/**
 * Defines the desired output structure
 */
export interface OutputOptions<
  Config extends IFFmpegConfiguration<string, string, string>
> {
  /**
   * Choose an output format such as mp4 or wav
   */
  format: Config['extensions'];
  /**
   * Choose a path where to save the output to
   * (Not relevat in browser environments)
   */
  path?: string;
  /**
   * Seek a time to start the output in seconds
   */
  seek?: number;
  /**
   * Set the total duration of the output in seconds
   */
  duration?: number;
  /**
   * Audio options
   */
  audio?: AudioOutputOptions<Config['audioCodecs']> | DisabledAudioOutput;
  /**
   * Video options
   */
  video?: VideoOutputOptions<Config['videoCodecs']> | DisabledVideoOutput;
}
