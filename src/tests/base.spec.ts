import { test, expect, Page } from '@playwright/test';

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.describe('FFmpegBase functionalities', async () => {
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

  test('test intercepting logs', async () => {
    const messages = await page.evaluate(async () => {
      const _messages: string[] = [];
      ffmpeg.onMessage(((msg) => {
        _messages.push(msg);
      }));
      await ffmpeg.exec(["-help"]);
      return _messages;
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.at(0)).toBeTruthy();
    expect(messages.at(0)?.length).toBeGreaterThan(0);
  });

  test('test removing onMessage callback', async () => {
    const messages = await page.evaluate(async () => {
      const _messages0: string[] = [];
      const _messages1: string[] = [];

      const cb0 = (msg: string) => _messages0.push(msg)
      const cb1 = (msg: string) => _messages1.push(msg)

      ffmpeg.onMessage(cb0);
      ffmpeg.onMessage(cb1);

      await ffmpeg.exec(["-help"]);

      ffmpeg.removeOnMessage(cb1);

      return [_messages0, _messages1];
    });

    expect(messages[0].length).toBeGreaterThan(0);
    expect(messages[1].length).toBeGreaterThan(0);
    // callback function 1 should have recieved 
    // half as many messages than callback funtion 0
    expect(messages[1].length).toBeGreaterThan(messages[0].length / 2);
  });


  test('test clearing memory works', async () => {
    const result = await page.evaluate(async () => {
      const inputName = 'input.ogg';
      const outputName = 'output.wav';
      await ffmpeg.writeFile(inputName, 'http://localhost:5173/samples/audio.ogg');
      await ffmpeg.exec(['-i', inputName, outputName]);
      const render = ffmpeg.readFile(outputName).length;

      ffmpeg.clearMemory();
      // try to read memory again should fail
      let input = null;
      let output = null;

      // input and output should stay null
      try {
        input = ffmpeg.readFile(inputName);
      } catch (e) { }
      try {
        output = ffmpeg.readFile(outputName);
      } catch (e) { }

      return { render, input, output }
    });

    expect(result.render).toBeGreaterThan(0);
    expect(result.output).toBe(null);
    expect(result.input).toBe(null);
  });
});
