import * as types from './types';

/**
 * Get uint 8 array from a blob or url
 */
export const toUint8Array = async (
  data: Blob | string
): Promise<Uint8Array> => {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    const res = await fetch(data);
    buffer = await res.arrayBuffer();
  } else {
    buffer = await await data.arrayBuffer();
  }
  return new Uint8Array(buffer);
};

/**
 * Create local url for external script to
 * work around cors issues
 */
export const toBlobURL = async (url: string) => {
  const mimeTypes: Record<string, string> = {
    js: 'application/javascript',
    wasm: 'application/wasm',
  };
  const buffer = await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buffer], {
    type: mimeTypes[url.split('.')?.at(-1) ?? 'js'],
  });
  return URL.createObjectURL(blob);
};

/**
 * Noop logger
 */
export const noop = (msg?: any, ...params: any[]) => {
  msg;
  params;
};

/**
 * Parse a ffmpeg progress event output
 */
export const parseProgress = (msg: string): number => {
  // strip non required information
  const match = msg
    .match(/(^frame=)(\W)*([0-9]{1,})(\W)/)
    ?.at(0) // get first match
    ?.replace(/frame=/, '') // replace prefix
    ?.trim(); // remove spaces surrounding the number

  return parseInt(match ?? '0');
};

/**
 * Parse a ffmpeg message and extract the meta
 * data of the input
 * @param data reference to the object that should
 * recieve the data
 * @returns Callback function that can be passed into
 * the onMessage function
 */
export const parseMetadata = (data: types.Metadata) => (msg: string) => {
  // this string contains the format of the input
  if (msg.match(/Input #/)) {
    Object.assign(data, {
      formats: msg
        .replace(/(Input #|from 'probe')/gm, '')
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 1),
    });
  }

  // this string contains the duration of the input
  if (msg.match(/Duration:/)) {
    const splits = msg.split(',');
    for (const split of splits) {
      if (split.match(/Duration:/)) {
        const duration = split.replace(/Duration:/, '').trim();
        Object.assign(data, {
          duration: Date.parse(`01 Jan 1970 ${duration} GMT`) / 1000,
        });
      }
      if (split.match(/bitrate:/)) {
        const bitrate = split.replace(/bitrate:/, '').trim();
        Object.assign(data, { bitrate });
      }
    }
  }

  // there can be one or more streams
  if (msg.match(/Stream #/)) {
    const splits = msg.split(',');

    // id is the same for all streams
    const base = {
      id: splits
        ?.at(0)
        ?.match(/[0-9]{1,2}:[0-9]{1,2}/)
        ?.at(0),
    };

    // match video streams
    if (msg.match(/Video/)) {
      const stream: types.VideoStream = base;
      for (const split of splits) {
        // match codec
        if (split.match(/Video:/)) {
          Object.assign(stream, {
            codec: split
              .match(/Video:\W*[a-z0-9_-]*\W/i)
              ?.at(0)
              ?.replace(/Video:/, '')
              ?.trim(),
          });
        }
        // match size
        if (split.match(/[0-9]*x[0-9]*/)) {
          Object.assign(stream, { width: parseFloat(split.split('x')[0]) });
          Object.assign(stream, { height: parseFloat(split.split('x')[1]) });
        }
        // match fps
        if (split.match(/fps/)) {
          Object.assign(stream, {
            fps: parseFloat(split.replace('fps', '').trim()),
          });
        }
      }
      data.streams.video.push(stream);
    }

    // match audio streams
    if (msg.match(/Audio/)) {
      const stream: types.AudioStream = base;
      for (const split of splits) {
        // match codec
        if (split.match(/Audio:/)) {
          Object.assign(stream, {
            codec: split
              .match(/Audio:\W*[a-z0-9_-]*\W/i)
              ?.at(0)
              ?.replace(/Audio:/, '')
              ?.trim(),
          });
        }
        // match samle rate unit
        if (split.match(/hz/i)) {
          Object.assign(stream, {
            sampleRate: parseInt(split.replace(/[\D]/gm, '')),
          });
        }
      }
      data.streams.audio.push(stream);
    }
  }
};
