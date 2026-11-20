import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = new URL('../docs/screenshots/', import.meta.url);
await mkdir(output, { recursive: true });

const server = await createServer({ server: { host: '127.0.0.1', port: 4173 } });
await server.listen();
const address = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;

try {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(address, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__rooftopDebug);
  await page.evaluate(() => {
    window.__rooftopDebug.pause();
    window.__rooftopDebug.reset();
    window.__rooftopDebug.advance(.55);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: new URL('rooftop-run.png', output).pathname });

  await page.evaluate(() => {
    const game = window.__rooftopDebug;
    game.reset();
    game.advance((20 - (-12 + 4.5)) / 14.6);
    game.jump();
    game.advance(1.08);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: new URL('checkpoint.png', output).pathname });

  await page.evaluate(() => {
    const game = window.__rooftopDebug;
    game.reset();
    for (const far of [-12, -42, -73, -104, -135, -166, -197, -228]) {
      game.advance((game.state().z - (far + 4.5)) / 14.6);
      game.jump();
      game.advance(1.08);
    }
    game.advance(2);
  });
  await page.waitForTimeout(450);
  await page.screenshot({ path: new URL('finish.png', output).pathname });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.__rooftopDebug.reset();
    window.__rooftopDebug.advance(.5);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: new URL('mobile.png', output).pathname });

  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log('Captured real gameplay screenshots in docs/screenshots/');
} finally {
  await browser?.close();
  await server.close();
}
