import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { FFmpeg } from '@diffusion-studio/ffmpeg-js';

const logger = () => null;
const ffmpeg = new FFmpeg({ logger, lib: "lgpl-base" });

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript + FFmpeg</h1>
    <div class="card">
      <button id="selector" type="button">Select File</button>
    </div>
    <p class="read-the-docs">
      Convert MP4 into AVI
    </p>
  </div>
`

const showFileDialog = async (accept: string) => {
  return new Promise<File | undefined>((resolve) => {
    // setup input
    const input = document.createElement('input');
    // document.head.appendChild(input);
    input.type = "file";
    input.accept = accept;
    // listen for changes
    input.onchange = (fileEvent: Event) => {
      const file = (<HTMLInputElement>fileEvent.target)?.files?.[0];
      resolve(file);
    }
    input.click();
  });
}

const readFile = async (file: File) => {
  return new Promise<Blob | undefined>((resolve) => {
    // setting up the reader
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    // read file
    reader.onload = readerEvent => {
      const content = readerEvent?.target?.result;
      if (!content || typeof content == "string") {
        resolve(undefined);
      } else {
        resolve(new Blob([new Uint8Array(content)], { type: file.type }));
      }
    }
  })
}

const downloadData = (file: Uint8Array, mimeType: string) => {
  // Create link and download
  const a = document.createElement('a');
  document.head.appendChild(a);
  a.download = `rendered-file.${mimeType.split("/").at(1)}`
  a.href = URL.createObjectURL(
    new Blob([file], { type: mimeType })
  )
  a.click();
}

document.getElementById('selector')?.addEventListener('click', async () => {
  const file = await showFileDialog('video/mp4');

  if (!file) return;

  const blob = await readFile(file);

  if (!blob) return;

  const result: Uint8Array | undefined = await ffmpeg
    .input({ source: blob })
    .ouput({ format: 'avi' })
    .export()

  if (!result) {
    alert('File processing failed!');
  } else {
    alert('File has been exported successfully and will be saved to your downloads folder');
    downloadData(result, 'video/avi');
  }
});

