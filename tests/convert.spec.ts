import { test, expect, Page } from '@playwright/test';
import { VIDEO_EXTENSIONS, SUPPORTED_VIDEO_CONVERSIONS } from './fixtures';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpeg basic file extension conversions', async () => {
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

  for (const format of VIDEO_EXTENSIONS) {
    test(`test converting ${format} into gif`, async () => {
      const length = await page.evaluate(async (ext) => {
        const result = await ffmpeg
          .input({ source: `http://localhost:5173/samples/video.${ext}` })
          .ouput({
            format: 'gif',
            video: { size: { width: 240, height: 135 }, framerate: 5 },
          })
          .export();

        return result?.length;
      }, format);
      expect(length).toBeGreaterThan(0);
    });
  }

  for (const formats of SUPPORTED_VIDEO_CONVERSIONS) {
    test(`test converting video from ${formats[0]} into ${formats[1]} with trim`, async () => {
      const length = await page.evaluate(async (ext) => {
        const result = await ffmpeg
          .input({
            source: `http://localhost:5173/samples/video.${ext[0]}`,
            seek: 2,
          })
          .ouput({ format: ext[1], duration: 3 })
          .export();

        return result?.length;
      }, formats);
      expect(length).toBeGreaterThan(0);
    });
  }
});
