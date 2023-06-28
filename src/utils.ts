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
  const buf = await (await fetch(url)).arrayBuffer();
  const blob = new Blob([buf], {
    type: mimeTypes[url.split('.')?.at(-1) ?? 'js'],
  });
  const blobURL = URL.createObjectURL(blob);
  return blobURL;
};

/**
 * Noop logger
 */
export const noop = (msg?: any, ...params: any[]) => {
  msg = undefined;
  params = [];
};
