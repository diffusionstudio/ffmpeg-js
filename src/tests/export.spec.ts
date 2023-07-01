import { test, expect, Page } from '@playwright/test';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpeg basic exporting', async () => {
  /**
   * Get index page and wait until ffmpeg is ready
   */
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173/');

    const ready = await page.evaluate(async () => {
      if (!ffmpeg.isReady) {
        await new Promise<void>((resolve) => {
          ffmpeg.whenReady(resolve);
        });
      }

      return ffmpeg.isReady;
    });
    expect(ready).toBe(true);
  });

  test('test converting ogg into wav', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.ogg' })
        .ouput({ format: 'wav' })
        .export();

      // evaluate return type can't be Uint8Array
      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test converting ogg to flac', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.ogg' })
        .ouput({ format: 'flac' })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test converting ogg to m4v using aac encoding', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.ogg' })
        .ouput({
          format: 'm4v',
          audio: {
            codec: 'aac',
            bitrate: 64_000,
            numberOfChannels: 1,
            sampleRate: 11025,
          },
        })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test converting mp3 to ogg', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.mp3' })
        .ouput({ format: 'ogg' })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test cutting a mp3 and and converting it to wav', async () => {
    const lengths = await page.evaluate(async () => {
      const result1 = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.mp3' })
        .ouput({ format: 'wav' })
        .export();

      const result2 = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.mp3', seek: 5 })
        .ouput({ format: 'wav', duration: 5 })
        .export();

      return [result1?.length, result2?.length];
    });
    expect(lengths[0]).toBeGreaterThan(lengths[1] ?? 0);
  });

  test('test converting wav to flac', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/audio.wav' })
        .ouput({ format: 'flac' })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test converting mp4 into avi', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/video.mp4' })
        .ouput({ format: 'avi' })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test converting mp4 into gif', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/video.mp4' })
        .ouput({ format: 'gif' })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });

  test('test adding wav audio track to mp4', async () => {
    const length = await page.evaluate(async () => {
      const result = await ffmpeg
        .input({ source: 'http://localhost:5173/samples/video.mp4' })
        .input({ source: 'http://localhost:5173/samples/audio.wav' })
        .ouput({
          format: 'mp4',
          duration: 10,
          video: { codec: 'copy' },
          audio: { codec: 'aac' },
        })
        .export();

      return result?.length;
    });
    expect(length).toBeGreaterThan(0);
  });
});
