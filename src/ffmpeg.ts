import { IFFmpegConfiguration } from './interfaces';
import { FFmpegBase } from './ffmpeg-base';
import * as types from './types';
import configs from './ffmpeg-config';
import { noop } from './utils';

export class FFmpeg<
  Config extends IFFmpegConfiguration<
    string,
    string,
    string
  > = types.FFmpegConfiguration
> extends FFmpegBase {
  private _inputs: types.InputOptions[] = [];
  private _output?: types.OutputOptions<Config>;
  private _middleware: string[] = [];

  public constructor(settings: types.FFmpegSettings = {}) {
    let logger = console.log;
    let source = configs[settings?.config ?? "lgpl-base"];

    if (settings?.log == false) {
      logger = noop;
    }

    if (settings?.source) {
      source = settings.source;
    }

    super({ logger, source });
  }

  /**
   * Get all supported video decoders, encoders and
   * audio decoder, encoders. You can test if a codec
   * is available like so:
   * @example
   * const codecs = await ffmpeg.codecs();
   *
   * if ("aac" in codecs.audio.encoders) {
   *  // do something
   * }
   */
  public async codecs(): Promise<types.SupportedCodecs> {
    const codec: types.EncoderDecoderRecords = {
      encoders: {},
      decoders: {},
    };
    // it's important to copy the objects here
    const supportedCodecs: types.SupportedCodecs = {
      video: JSON.parse(JSON.stringify(codec)),
      audio: JSON.parse(JSON.stringify(codec)),
    };

    // parse codec message
    const messageToCodec = (msg: string): Record<string, string> => {
      msg = msg
        .substring(7)
        .replace(/\W{2,}/, ' ')
        .trim();
      const splits = msg.split(' ');

      const key = splits.shift() ?? '';
      const val = splits.join(' ');

      return { [key]: val };
    };

    // match decoder/encoder audio/video types
    this.onMessage((msg) => {
      msg = msg.trim();
      let keys: [
        keyof types.SupportedCodecs,
        keyof types.EncoderDecoderRecords
      ][] = [];

      if (!msg.match(/[DEVASIL\.]{6}\W(?!=)/)) return;
      if (msg.match(/^D.V/)) keys.push(['video', 'decoders']);
      if (msg.match(/^.EV/)) keys.push(['video', 'encoders']);
      if (msg.match(/^D.A/)) keys.push(['audio', 'decoders']);
      if (msg.match(/^.EA/)) keys.push(['audio', 'encoders']);

      for (const [track, codec] of keys) {
        Object.assign(supportedCodecs[track][codec], messageToCodec(msg));
      }
    });

    await this.exec(['-codecs']);
    return supportedCodecs;
  }

  /**
   * Get all supported muxers and demuxers, e.g. mp3, webm etc.
   * You can test if a format is available like this:
   * @example
   * const formats = await ffmpeg.formats();
   *
   * if ("mp3" in formats.demuxers) {
   *  // do something
   * }
   */
  public async formats(): Promise<types.SupportedFormats> {
    const supportedFormats: types.SupportedFormats = {
      muxers: {},
      demuxers: {},
    };

    // parse format message
    const messageToFormat = (msg: string): Record<string, string> => {
      msg = msg
        .substring(3)
        .replace(/\W{2,}/, ' ')
        .trim();
      const splits = msg.split(' ');

      const key = splits.shift() ?? '';
      const val = splits.join(' ');

      return { [key]: val };
    };

    // match muxers and demuxers
    this.onMessage((msg) => {
      msg = msg.substring(1);
      let keys: (keyof types.SupportedFormats)[] = [];
      if (!msg.match(/[DE\.]{2}\W(?!=)/)) return;
      if (msg.match(/^D./)) keys.push('demuxers');
      if (msg.match(/^.E/)) keys.push('muxers');

      for (const key of keys) {
        Object.assign(supportedFormats[key], messageToFormat(msg));
      }
    });

    await this.exec(['-formats']);
    return supportedFormats;
  }

  /**
   * Add a new input using the specified options
   */
  public input(options: types.InputOptions): this {
    // determine if user wants to create new output
    if (this._middleware.length > 0 || this._output) {
      // reset instructions
      this._inputs = [];
      this._middleware = [];
      this._output = undefined;
      this.clearMemory();
    }
    this._inputs.push(options);
    return this;
  }

  /**
   * Define the ouput format
   */
  public ouput(options: types.OutputOptions<Config>): this {
    this._output = options;
    return this;
  }

  /**
   * Add an audio filter [see](https://ffmpeg.org/ffmpeg-filters.html#Audio-Filters)
   * for more information
   */
  public audioFilter(filter: string): this {
    this._middleware.push('-af', filter);
    if (this._inputs.length > 1) {
      throw new Error(
        'Cannot use filters on multiple outputs, please use filterComplex instead'
      );
    }
    return this;
  }

  /**
   * Add an video filter [see](https://ffmpeg.org/ffmpeg-filters.html#Video-Filters)
   * for more information
   */
  public videoFilter(filter: string): this {
    this._middleware.push('-vf', filter);
    if (this._inputs.length > 1) {
      throw new Error(
        'Cannot use filters on multiple outputs, please use filterComplex instead'
      );
    }
    return this;
  }

  /**
   * Add a complex filter to multiple videos [see](https://ffmpeg.org/ffmpeg-filters.html)
   * for more information
   */
  public complexFilter(filter: string): this {
    this._middleware.push('-filter_complex', filter);
    return this;
  }

  /**
   * Get the ffmpeg command from the specified
   * inputs and outputs.
   */
  public async command(): Promise<string[]> {
    const command: string[] = [];
    command.push(...(await this.parseInputOptions()));
    command.push(...this._middleware);
    command.push(...(await this.parseOutputOptions()));
    return command;
  }

  /**
   * Exports the specified input(s)
   */
  public async export(): Promise<Uint8Array | undefined> {
    const cmd = await this.command();
    await this.exec(cmd);
    const file = this.readFile(cmd.at(-1) ?? '');
    this.clearMemory();
    return file;
  }

  private parseOutputOptions(): string[] {
    if (!this._output) {
      throw new Error('Please define the output first');
    }

    const { format, path, audio, video, seek, duration } = this._output;
    const command: string[] = [];

    let output = `output.${format}`;

    if (path) {
      output = path + output;
    }
    if (seek) {
      command.push('-ss', seek.toString());
    }
    if (duration) {
      command.push('-t', duration.toString());
    }

    command.push(...this.parseAudioOutput(audio));
    command.push(...this.parseVideoOutput(video));
    command.push(output);

    return command;
  }

  private parseAudioOutput(
    audio: types.OutputOptions<Config>['audio']
  ): string[] {
    if (!audio) return [];
    if ('disableAudio' in audio) {
      return audio.disableAudio ? ['-an'] : [];
    }
    const command: string[] = [];

    if (audio.codec) {
      command.push('-c:a', audio.codec);
    }
    if (audio.bitrate) {
      command.push('-b:a', audio.bitrate.toString());
    }
    if (audio.numberOfChannels) {
      command.push('-ac', audio.numberOfChannels.toString());
    }
    if (audio.volume) {
      command.push('-vol', audio.volume.toString());
    }
    if (audio.sampleRate) {
      command.push('-ar', audio.sampleRate.toString());
    }
    return command;
  }

  private parseVideoOutput(
    video: types.OutputOptions<Config>['video']
  ): string[] {
    if (!video) return [];
    if ('disableVideo' in video) {
      return video.disableVideo ? ['-vn'] : [];
    }
    const command: string[] = [];

    if (video.codec) {
      command.push('-c:v', video.codec);
    }
    if (video.bitrate) {
      command.push('-b:v', video.bitrate.toString());
    }
    if (video.aspectRatio) {
      command.push('-aspect', video.aspectRatio.toString());
    }
    if (video.framerate) {
      command.push('-r', video.framerate.toString());
    }
    if (video.size) {
      command.push('-s', `${video.size.width}x${video.size.height}`);
    }
    return command;
  }

  private async parseInputOptions(): Promise<string[]> {
    const commands: string[] = [];
    for (const input of this._inputs) {
      commands.push(...(await this.parseImageInput(input)));
      commands.push(...(await this.parseMediaInput(input)));
    }
    return commands;
  }

  private async parseImageInput(input: types.InputOptions): Promise<string[]> {
    // make sure the input is an image sequence
    if (!('sequence' in input)) return [];

    const pad: number = input.sequence.length.toString().length;
    const prefix: string = 'image-sequence-';
    let name = `${prefix}%0${pad}d`;
    const commands: string[] = [];

    for (const [idx, img] of input.sequence.entries()) {
      if (img instanceof Blob || img.match(/(^http(s?):\/\/|^\/\S)/)) {
        // write to memfs
        const writeName = `${prefix}${idx.toString().padStart(idx, '0')}`;
        await this.writeFile(writeName, img);
      } else {
        // match pattern and change sequence name
        const match = img.match(/[0-9]{1,20}/);
        if (match) {
          const [count] = match;
          name = img.replace(/[0-9]{1,20}/, `%0${count.length}d`);
        }
      }
    }

    commands.push('-framerate', input.framerate.toString());
    commands.push('-i', name);
    return commands;
  }

  private async parseMediaInput(input: types.InputOptions): Promise<string[]> {
    // make sure the input is not an image sequence
    if (!('source' in input)) return [];

    const { source } = input;
    const commands: string[] = [];

    const name = `input-${new Date().getTime()}`;

    if (input.seek) {
      commands.push('-ss', input.seek.toString());
    }

    if (source instanceof Blob || source.match(/(^http(s?):\/\/|^\/\S)/)) {
      await this.writeFile(name, source);
      commands.push('-i', name);
    } else {
      commands.push('-i', source);
    }

    return commands;
  }
}
