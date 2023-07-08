import { test, expect, Page } from '@playwright/test';
import { intersect } from './test-utils';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpeg get capabilities', async () => {
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

  test('test that popular audio decoders are available', async () => {
    const codecs = await page.evaluate(async () => {
      return await ffmpeg.codecs();
    });

    expect(codecs).toBeTruthy();

    expect(Object.keys(codecs.audio.decoders).includes('aac')).toBe(true);
    expect(Object.keys(codecs.audio.decoders).includes('alac')).toBe(true);
    expect(Object.keys(codecs.audio.decoders).includes('flac')).toBe(true);
    expect(Object.keys(codecs.audio.decoders).includes('mp3')).toBe(true);
    expect(Object.keys(codecs.audio.decoders).includes('opus')).toBe(true);
    expect(Object.keys(codecs.audio.decoders).includes('vorbis')).toBe(true);
  });

  test('test that popular audio encoders are available', async () => {
    const codecs = await page.evaluate(async () => {
      return await ffmpeg.codecs();
    });

    expect(codecs).toBeTruthy();

    expect(Object.keys(codecs.audio.encoders).includes('aac')).toBe(true);
    expect(Object.keys(codecs.audio.encoders).includes('flac')).toBe(true);
    expect(Object.keys(codecs.audio.encoders).includes('opus')).toBe(true);
    expect(Object.keys(codecs.audio.encoders).includes('vorbis')).toBe(true);
  });

  test('test that popular video decoders are available', async () => {
    const codecs = await page.evaluate(async () => {
      return await ffmpeg.codecs();
    });

    expect(codecs).toBeTruthy();

    expect(Object.keys(codecs.video.decoders).includes('gif')).toBe(true);
    expect(Object.keys(codecs.video.decoders).includes('h264')).toBe(true);
    expect(Object.keys(codecs.video.decoders).includes('hevc')).toBe(true);
  });

  test('test that popular video encoders are available', async () => {
    const codecs = await page.evaluate(async () => {
      return await ffmpeg.codecs();
    });

    expect(codecs).toBeTruthy();

    expect(Object.keys(codecs.video.encoders).includes('prores')).toBe(true);
    expect(Object.keys(codecs.video.encoders).includes('yuv4')).toBe(true);
    expect(Object.keys(codecs.video.encoders).includes('h263')).toBe(true);
    expect(Object.keys(codecs.video.encoders).includes('h263p')).toBe(true);
  });

  test("test that audio/video encoders/decoders don't intersect", async () => {
    const codecs = await page.evaluate(async () => {
      return await ffmpeg.codecs();
    });

    expect(codecs).toBeTruthy();

    expect(
      intersect(
        Object.keys(codecs.video.encoders),
        Object.keys(codecs.audio.encoders)
      ).length
    ).toBe(0);

    expect(
      intersect(
        Object.keys(codecs.video.decoders),
        Object.keys(codecs.audio.decoders)
      ).length
    ).toBe(0);

    expect(
      intersect(
        Object.keys(codecs.video.encoders),
        Object.keys(codecs.audio.decoders)
      ).length
    ).toBe(0);

    expect(
      intersect(
        Object.keys(codecs.video.decoders),
        Object.keys(codecs.audio.encoders)
      ).length
    ).toBe(0);
  });

  test('test that .formats returns popular demuxers', async () => {
    const formats = await page.evaluate(async () => {
      return await ffmpeg.formats();
    });

    expect(formats).toBeTruthy();

    expect(Object.keys(formats.demuxers).includes('mp3')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('ogg')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('wav')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('mpeg')).toBe(true);
  });

  test('test that .formats returns popular muxers', async () => {
    const formats = await page.evaluate(async () => {
      return await ffmpeg.formats();
    });

    expect(formats).toBeTruthy();

    expect(Object.keys(formats.demuxers).includes('mp3')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('ogg')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('wav')).toBe(true);
    expect(Object.keys(formats.demuxers).includes('mpeg')).toBe(true);
  });

  test('test that .meta returns a valid meta data dictionary', async () => {
    const metadata = await page.evaluate(async () => {
      return await ffmpeg.meta('/samples/video.mp4');
    });

    expect(Object.keys(metadata).length).toBeGreaterThan(0);
    expect(metadata.bitrate?.length).toBeGreaterThan(0);
    expect(metadata.duration).toBeGreaterThanOrEqual(30);
    expect(metadata.formats?.includes('mp4')).toBe(true);
    expect(metadata.streams.audio.length).toBe(1);
    expect(metadata.streams.video.length).toBe(1);
    // audio checks
    expect(metadata.streams.audio.at(0)?.codec).toBe('aac');
    expect(metadata.streams.audio.at(0)?.id).toBe('0:1');
    expect(metadata.streams.audio.at(0)?.sampleRate).toBe(48000);
    // video checks
    expect(metadata.streams.video.at(0)?.codec).toBe('h264');
    expect(metadata.streams.video.at(0)?.fps).toBe(30);
    expect(metadata.streams.video.at(0)?.id).toBe('0:0');
    expect(metadata.streams.video.at(0)?.height).toBe(270);
    expect(metadata.streams.video.at(0)?.width).toBe(480);
  });
});
