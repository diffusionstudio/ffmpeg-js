import { noop, toBlobURL, toUint8Array } from './utils';
import * as types from './types';
import * as utils from './utils';

export class FFmpegBase {
  private _module: any;
  private _ffmpeg: any;

  private _logger = noop;
  private _source: string;

  private _uris?: types.WasmModuleURIs;

  private _whenReady: Array<types.EventCallback> = [];
  private _whenExecutionDone: Array<types.EventCallback> = [];

  private _onMessage: Array<types.MessageCallback> = [];
  private _onProgress: Array<types.ProgressCallback> = [];

  private _memory: string[] = [];

  /**
   * Is true when the script has been
   * loaded successfully
   */
  public isReady: boolean = false;

  public constructor({ logger, source }: types.FFmpegBaseSettings) {
    this._source = source;
    this._logger = logger;
    this.createFFmpegScript();
  }

  /**
   * Handles the ffmpeg logs
   */
  private handleMessage(msg: string) {
    this._logger(msg);
    if (msg.match(/(FFMPEG_END|error)/i)) {
      this._whenExecutionDone.forEach((cb) => cb());
    }
    if (msg.match(/^frame=/)) {
      this._onProgress.forEach((cb) => cb(utils.parseProgress(msg)));
    }
    this._onMessage.forEach((cb) => cb(msg));
  }

  private handleScriptLoadError() {
    this._logger('Failed to load script!');
  }

  private async createScriptURIs() {
    return {
      core: await toBlobURL(this._source),
      wasm: await toBlobURL(this._source.replace('.js', '.wasm')),
      worker: await toBlobURL(this._source.replace('.js', '.worker.js')),
    };
  }

  private handleLocateFile(path: string, prefix: string) {
    if (path.endsWith('ffmpeg-core.wasm')) {
      return this._uris?.wasm;
    }
    if (path.endsWith('ffmpeg-core.worker.js')) {
      return this._uris?.worker;
    }
    return prefix + path;
  }

  private async handleScriptLoad() {
    //@ts-ignore
    const core: any = await createFFmpegCore({
      mainScriptUrlOrBlob: this._uris?.core,
      printErr: this.handleMessage.bind(this),
      print: this.handleMessage.bind(this),
      locateFile: this.handleLocateFile.bind(this),
    });

    this._logger('CREATED FFMPEG WASM:', core);
    this.isReady = true;
    this._module = core;
    this._ffmpeg = this._module.cwrap('proxy_main', 'number', [
      'number',
      'number',
    ]);
    this._whenReady.forEach((cb) => cb());
  }

  private async createFFmpegScript() {
    const script = document.createElement('script');
    this._uris = await this.createScriptURIs();
    script.src = this._uris.core;
    script.type = 'text/javascript';
    script.addEventListener('load', this.handleScriptLoad.bind(this));
    script.addEventListener('error', this.handleScriptLoadError.bind(this));
    document.head.appendChild(script);
  }

  /**
   * Gets called when ffmpeg has been
   * initiated successfully and is ready
   * to receive commands
   */
  public whenReady(cb: types.EventCallback) {
    if (this.isReady) cb();
    else this._whenReady.push(cb);
  }

  /**
   * Gets called when ffmpeg is done executing
   * a script
   */
  public whenExecutionDone(cb: types.EventCallback) {
    this._whenExecutionDone.push(cb);
  }

  /**
   * Gets called when ffmpeg logs a message
   */
  public onMessage(cb: types.MessageCallback) {
    this._onMessage.push(cb);
  }

  /**
   * Remove the callback function from the
   * message callbacks
   */
  public removeOnMessage(cb: types.MessageCallback) {
    this._onMessage = this._onMessage.filter((item) => item != cb);
  }

  /**
   * Gets called when a number of frames
   * has been rendered
   */
  public onProgress(cb: types.ProgressCallback) {
    this._onProgress.push(cb);
  }

  /**
   * Remove the callback function from the
   * progress callbacks
   */
  public removeOnProgress(cb: types.ProgressCallback) {
    this._onProgress = this._onProgress.filter((item) => item != cb);
  }

  /**
   * Use this message to execute ffmpeg commands
   */
  public async exec(args: string[]): Promise<void> {
    this._ffmpeg(...this.parseArgs(['./ffmpeg', '-nostdin', '-y', ...args]));

    await new Promise<void>((resolve) => {
      this.whenExecutionDone(resolve);
    });

    // add file that has been created to memory
    if (args.at(-1)?.match(/\S\.[A-Za-z0-9_-]{1,20}/)) {
      this._memory.push(args.at(-1) ?? '');
    }
  }

  /**
   * This method allocates memory required
   * to execute the command
   */
  private parseArgs(args: string[]) {
    const argsPtr = this._module._malloc(
      args.length * Uint32Array.BYTES_PER_ELEMENT
    );

    args.forEach((s, idx) => {
      const sz = this._module.lengthBytesUTF8(s) + 1;
      const buf = this._module._malloc(sz);
      this._module.stringToUTF8(s, buf, sz);
      this._module.setValue(
        argsPtr + Uint32Array.BYTES_PER_ELEMENT * idx,
        buf,
        'i32'
      );
    });
    return [args.length, argsPtr];
  }

  /**
   * Read a file that is stored in the memfs
   */
  public readFile(path: string): Uint8Array {
    this._logger('READING FILE:', path);
    return this._module.FS.readFile(path);
  }

  /**
   * Delete a file that is stored in the memfs
   */
  public deleteFile(path: string): void {
    try {
      this._logger('DELETING FILE:', path);
      this._module.FS.unlink(path);
    } catch (e) {
      this._logger('Could not delete file');
    }
  }

  /**
   * Write a file to the memfs, the first argument
   * is the file name to use. The second argument
   * needs to contain an url to the file or the file
   * as a blob
   */
  public async writeFile(path: string, file: string | Blob): Promise<void> {
    const data: Uint8Array = await toUint8Array(file);

    this._logger('WRITING FILE:', path);
    this._module.FS.writeFile(path, data);
    this._memory.push(path);
  }

  /**
   * Call this method to delete all files that
   * have been written to the memfs memory
   */
  public clearMemory(): void {
    for (const path of [...new Set(this._memory)]) {
      this.deleteFile(path);
    }
    this._memory = [];
  }
}
