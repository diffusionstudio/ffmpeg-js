# 🎥 FFmpeg.js: A WebAssembly-powered FFmpeg Interface for Browsers

Welcome to FFmpeg.js, an innovative library that offers a WebAssembly-powered interface for utilizing FFmpeg in the browser. 🌐💡

### [👥Join our Discord](https://discord.gg/n3mpzfejAb)

## Demo

![GIF Converter Demo](./public/preview.gif)

[Open Demo Application](https://ffmpeg-js-preview.vercel.app/)

## ❓ Why FFmpeg.js?

This project has been inspired by the awesome work of [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), but we noted a few drawbacks that might limit its applicability for broader use:

1. The project employs a GPL3 build of FFmpeg, limiting its use for commercial projects. 🚫💼
2. It's developed in JavaScript and hence offers limited typing, restricting the potential for more rigorous static type checks. ❗⌨️
3. The lack of an object-oriented approach for writing FFmpeg commands. 🔄📝

## ✔️ FFmpeg.js to the Rescue!

Addressing the issues above, FFmpeg.js:

- Provides an LGPL build of FFmpeg, making it commercially more viable, checkout https://ffmpeg.org/legal.html for more detail. 🟢💼
- Is written in TypeScript, introducing static type checking to enhance code reliability. 👌🔍
- Offers an object-oriented interface for writing FFmpeg commands, inspired by `fluent-ffmpeg`
  , making it more programmer-friendly. 🎯🔄

However, it's important to note that as of now, FFmpeg.js runs only in Chrome, Firefox, and Edge browsers. It doesn't support Safari or Node. 🚧🔍

## 🚀 Setup

Setting up FFmpeg.js is a breeze!

```bash
npm i @diffusion-studio/ffmpeg-js
```

This should install the library. Now because ffmpeg.js requires the use of the [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) you need to enable `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on the server side.

### ⚡️Vite

In a vite environment you can simply add these policies by putting the following into your `vite.config.js`:

```js
...
server: {
    ...
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
},
...
```

### △Next.js

Here is an example `next.config.js` that supports the SharedArrayBuffer:
```
module.exports = {
    async headers() {
        return [
            {
                source: '/',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                ],
            },
        ];
    },
};
```

## 💻 Usage

Somewhere in your project you need to initiate a ffmpeg instance.

```typescript
import { FFmpeg } from '@diffusion-studio/ffmpeg-js';

const ffmpeg = new FFmpeg();
```

By default this will pull a [LGPLv2.1 compliant build](https://github.com/diffusion-studio/ffmpeg-wasm-lgpl-build) of FFmpeg from the [UNPKG delivery network](https://www.unpkg.com).<br> Consequently if you immidiately intent to run commands you need to wait until the binaries have been fetched successfully, like this:

```typescript
ffmpeg.whenReady(async () => {
  await ffmpeg.exec(['-help']);
});
```

This will output the ffmpeg help as fast as possible.

> HINT: Even though this library intends to provide a object oriented interface for ffmpeg, you can still run commands manually using the `exec` method.

When working with files you need to save them to the in-memory file system first:

```typescript
const source = 'https://<path to file>/<filename>.mp4';

// write to file system
await ffmpeg.writeFile('input.mp4', source);

// convert mp4 to avi
await ffmpeg.exec(['-i', 'input.mp4', 'output.avi']);

// read from file system
const result: Uint8Array = ffmpeg.readFile('output.avi');

// free memory
ffmpeg.deleteFile('input.mp4');
ffmpeg.deleteFile('output.avi');
```

Let's see how you would get the same result the **object oriented** way.

```typescript
const source = 'https://<path to file>/<filename>.mp4';

const result: Uint8Array = ffmpeg
  .input({ source })
  .ouput({ format: 'avi' })
  .export();
```

> If you were wondering, yes the memory is being managed for you.

## 📖 Examples

Take a look at these tests for more examples:

- https://github.com/diffusion-studio/ffmpeg-js/blob/main/examples/src/main.ts
- https://github.com/diffusion-studio/ffmpeg-js/blob/main/tests/export.spec.ts
- https://github.com/diffusion-studio/ffmpeg-js/blob/main/tests/commands.spec.ts

## 🛑 Limitations

- Webassembly is limited to 2GB
- Difficult to handle in unit tests, it's probably best if you mock the FFmpeg class and leave the testing to us (which is also good practice).
- There is no hardware accileration available, making video encoding/decoding rather slow.

## ⚙️ Configurations

Currently there are two different FFmpeg configurations available with more on the way.

- `lgpl-base` (default): It is a compilation of FFmpeg without any external libraries, which is useful for audio & video muxing/demuxing and audio encoding/decoding. It is v2.1LGPL compliant and can therefore be used for commercial projects.
- `gpl-extended`: This is the [@ffmpeg/core](https://github.com/ffmpegwasm/ffmpeg.wasm-core) configuration, that has been built with `--enable-gpl` and `--enable-nonfree` and can therefore only be used for commercial projects if the entire codebase is publicly accessible. It supports popular delivery codecs such as `h264/h265/vp9` etc.

For more information about the supported codecs and muxers run the following commands:

```typescript
console.log(await ffmpeg.codecs());
console.log(await ffmpeg.formats());
```

This is how you can switch the configuration:

```typescript
import {
  FFmpeg,
  FFmpegConfigurationGPLExtended,
} from '@diffusion-studio/ffmpeg-js';

// FFmpegConfigurationGPLExtended will add the type extensions
const ffmpeg = new FFmpeg<FFmpegConfigurationGPLExtended>({
  config: 'gpl-extended',
});
```

Thats it!

We believe that FFmpeg.js will significantly streamline your interaction with FFmpeg in the browser, providing a more effective and efficient coding experience. Happy coding! 🚀🌟

### DISCLAIMER

_The information contained in this text is provided for informational purposes only. It is not intended as a comprehensive guide to the GPL and LGPL license usages nor does it offer legal advice. Laws and regulations surrounding software licenses can be complex and may change over time. The author and provider of this information cannot be held responsible for any errors, omissions, or any outcomes related to your use of this information._

_While every effort has been made to ensure the information presented here is accurate as of the date of publication, no guarantee is given as to its currency or applicability to your specific situation. You should not rely upon this information as a substitute for consultation with a legal professional or other competent advisors. Always consult with a qualified professional familiar with your particular circumstances before making decisions that could have legal implications._
