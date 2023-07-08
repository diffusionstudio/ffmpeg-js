import { test, expect, Page } from '@playwright/test';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpeg thumbnails extraction tests', async () => {
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

  test('test thumbnail extraction with default values', async () => {
    const images = await page.evaluate(async () => {
      const images: number[] = [];
      const generator = ffmpeg.thumbnails('/samples/video.mp4');

      for await (const image of generator) {
        images.push((await image.arrayBuffer()).byteLength);
      }

      return images;
    });

    expect(images.length).toBe(5);
    for (const image of images) {
      expect(image).toBeGreaterThan(0);
    }
  });

  test('test thumbnail extraction with start stop and count', async () => {
    const images = await page.evaluate(async () => {
      const images: number[] = [];
      const generator = ffmpeg.thumbnails('/samples/video.mov', 12, 3, 12);

      for await (const image of generator) {
        images.push((await image.arrayBuffer()).byteLength);
      }

      return images;
    });

    expect(images.length).toBe(12);
    for (const image of images) {
      expect(image).toBeGreaterThan(0);
    }
  });
});
