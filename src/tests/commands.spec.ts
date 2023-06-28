import { test, expect, Page } from '@playwright/test';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpeg create command', async () => {
  /**
   * Get index page and wait until ffmpeg is ready
   */
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173/');

    const ready = await page.evaluate(async () => {
      if (!ffmpeg.isReady) {
        await new Promise<void>((resolve) => {
          globalThis.ffmpeg.whenReady(resolve);
        });
      }

      return globalThis.ffmpeg.isReady;
    });
    expect(ready).toBe(true);
  });

  test('test that basic command can be created', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'abc.mp4' })
        .ouput({ format: 'mp3' })
        .command();
    });

    expect(command.length).toBe(3);
    expect(command.at(0)).toBe('-i');
    expect(command.at(1)).toBe('abc.mp4');
    expect(command.at(-1)?.endsWith('.mp3')).toBe(true);
  });

  test('test that new input resets exisiting ones', async () => {
    const command = await page.evaluate(async () => {
      globalThis.ffmpeg
        .input({ source: 'abc.mp4' })
        .ouput({ format: 'mp3', duration: 20 });

      return await globalThis.ffmpeg
        .input({ source: 'rrr.mp4' })
        .ouput({ format: 'm4v', duration: 10 })
        .command();
    });

    expect(command.length).toBe(5);
    expect(command.at(0)).toBe('-i');
    expect(command.at(1)).toBe('rrr.mp4');
    expect(command.at(2)).toBe('-t');
    expect(command.at(3)).toBe('10');
    expect(command.at(-1)?.endsWith('.m4v')).toBe(true);
  });

  test('test that input seeking works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'cba.mp3', seek: 40 })
        .ouput({ format: 'wav' })
        .command();
    });

    expect(command.length).toBe(5);
    expect(command.at(0)).toBe('-ss');
    expect(command.at(1)).toBe('40');
    expect(command.at(2)).toBe('-i');
    expect(command.at(3)).toBe('cba.mp3');
    expect(command.at(-1)?.endsWith('.wav')).toBe(true);
  });

  test('test that using an image sequence as input works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({
          sequence: ['my-image-0001.png', 'my-image-0002.png'],
          framerate: 30,
        })
        .ouput({ format: 'm4v' })
        .command();
    });

    expect(command.length).toBe(5);
    expect(command.at(0)).toBe('-framerate');
    expect(command.at(1)).toBe('30');
    expect(command.at(2)).toBe('-i');
    // make sure the pattern has been matched correctly
    expect(command.at(3)).toBe('my-image-%04d.png');
    expect(command.at(-1)?.endsWith('.m4v')).toBe(true);
  });

  test('test that adding filters works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'ccc.mp4' })
        .videoFilter('rotate=90')
        .audioFilter('silencedetect=noise=0.0001')
        .ouput({ format: 'm4v', seek: 10 })
        .command();
    });

    expect(
      command
        .join(' ')
        .startsWith(
          '-i ccc.mp4 -vf rotate=90 -af silencedetect=noise=0.0001 -ss 10'
        )
    ).toBe(true);
    expect(command.at(-1)?.endsWith('.m4v')).toBe(true);
  });

  test('test that adding a filter to multiple inputs throws error', async () => {
    const result = await page.evaluate(async () => {
      try {
        await globalThis.ffmpeg
          .input({ source: 'abc.mov' })
          .input({ source: 'xyz.mov' })
          .videoFilter('scale=640:360')
          .ouput({ format: 'm4v' })
          .command();
        return false;
      } catch (e) {
        return true;
      }
    });

    expect(result).toBe(true);
  });

  test('test that adding complex filters works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'abc.webm' })
        .input({ source: 'xyz.png' })
        .complexFilter('overlay')
        .ouput({ format: 'm4v' })
        .command();
    });

    expect(command.at(0)).toBe('-i');
    expect(command.at(1)).toBe('abc.webm');
    expect(command.at(2)).toBe('-i');
    expect(command.at(3)).toBe('xyz.png');
    expect(command.at(4)).toBe('-filter_complex');
    expect(command.at(5)).toBe('overlay');
    expect(command.at(-1)?.endsWith('.m4v')).toBe(true);
  });

  test('test that adding video output options works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'bbb.webm' })
        .ouput({
          format: 'm4v',
          video: {
            codec: 'h263',
            aspectRatio: 4,
            bitrate: 2_000_000,
            framerate: 25,
            size: { width: 640, height: 480 },
          },
        })
        .command();
    });

    expect(command.includes('-c:v')).toBe(true);
    expect(command.includes('h263')).toBe(true);
    expect(command.indexOf('h263')).toBe(command.indexOf('-c:v') + 1);

    expect(command.includes('-aspect')).toBe(true);
    expect(command.includes('4')).toBe(true);
    expect(command.indexOf('4')).toBe(command.indexOf('-aspect') + 1);

    expect(command.includes('-b:v')).toBe(true);
    expect(command.includes('2000000')).toBe(true);
    expect(command.indexOf('2000000')).toBe(command.indexOf('-b:v') + 1);

    expect(command.includes('-r')).toBe(true);
    expect(command.includes('25')).toBe(true);
    expect(command.indexOf('25')).toBe(command.indexOf('-r') + 1);

    expect(command.includes('-s')).toBe(true);
    expect(command.includes('640x480')).toBe(true);
    expect(command.indexOf('640x480')).toBe(command.indexOf('-s') + 1);
  });

  test('test that video output can be disabled', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'bbb.webm' })
        .ouput({
          format: 'm4v',
          video: { disableVideo: true },
        })
        .command();
    });

    expect(command.at(2)).toBe('-vn');
  });

  test('test that adding audio output options works', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'bbb.webm' })
        .ouput({
          format: 'm4v',
          audio: {
            codec: 'aac',
            bitrate: 128_000,
            numberOfChannels: 2,
            sampleRate: 44100,
            volume: 200,
          },
        })
        .command();
    });

    expect(command.includes('-c:a')).toBe(true);
    expect(command.includes('aac')).toBe(true);
    expect(command.indexOf('aac')).toBe(command.indexOf('-c:a') + 1);

    expect(command.includes('-b:a')).toBe(true);
    expect(command.includes('128000')).toBe(true);
    expect(command.indexOf('128000')).toBe(command.indexOf('-b:a') + 1);

    expect(command.includes('-ac')).toBe(true);
    expect(command.includes('2')).toBe(true);
    expect(command.indexOf('2')).toBe(command.indexOf('-ac') + 1);

    expect(command.includes('-ar')).toBe(true);
    expect(command.includes('44100')).toBe(true);
    expect(command.indexOf('44100')).toBe(command.indexOf('-ar') + 1);

    expect(command.includes('-vol')).toBe(true);
    expect(command.includes('200')).toBe(true);
    expect(command.indexOf('200')).toBe(command.indexOf('-vol') + 1);
  });

  test('test that audio output can be disabled', async () => {
    const command = await page.evaluate(async () => {
      return await globalThis.ffmpeg
        .input({ source: 'bbb.webm' })
        .ouput({
          format: 'm4v',
          audio: { disableAudio: true },
        })
        .command();
    });

    expect(command.at(2)).toBe('-an');
  });
});
