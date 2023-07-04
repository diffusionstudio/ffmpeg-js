import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  let publicDir = true;
  if (command === 'build') {
    publicDir = false;
  }

  return {
    publicDir,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'ffmpeg-js',
        formats: ['es'],
        fileName: 'ffmpeg-js'
      },
      rollupOptions: {
        external: [
          '/tests/',
        ],
      },
    },
    plugins: [dts({
      exclude: 'tests/**',
    })],
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  }
});
