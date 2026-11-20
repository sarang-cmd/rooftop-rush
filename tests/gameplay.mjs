import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const roofEdges = [-12, -42, -73, -104, -135, -166, -197, -228];
const server = await createServer({ server: { host: '127.0.0.1', port: 4173 } });
await server.listen();
const port = server.httpServer.address().port;
let browser;

try {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__rooftopDebug);
  await page.evaluate(() => {
    window.__rooftopDebug.pause();
    window.__rooftopDebug.reset();
  });
  assert.equal(await page.locator('#result').isVisible(), false);
  assert.equal(await page.locator('#timer').textContent(), '00:40');

  for (let i = 0; i < roofEdges.length; i++) {
    const before = await page.evaluate(() => window.__rooftopDebug.state());
    const secondsToMarker = (before.z - (roofEdges[i] + 4.5)) / 14.6;
    await page.evaluate(seconds => window.__rooftopDebug.advance(seconds), secondsToMarker);
    await page.evaluate(() => window.__rooftopDebug.jump());
    const landed = await page.evaluate(() => window.__rooftopDebug.advance(1.08));
    assert.equal(landed.roofIndex, i + 1, `Jump ${i + 1} should reach the next roof`);
    assert.equal(landed.grounded, true, `Jump ${i + 1} should land`);
    assert.equal(landed.checkpoint, Math.min(i + 1, 7));
  }
  const finish = await page.evaluate(() => window.__rooftopDebug.advance(2));
  assert.equal(finish.status, 'won');
  assert.equal(finish.checkpoint, 7);
  assert.ok(finish.elapsed < 40);
  assert.equal(await page.locator('#resultTitle').textContent(), 'YOU OWN THE SKY.');

  await page.evaluate(() => window.__rooftopDebug.reset());
  const afterFall = await page.evaluate(() => window.__rooftopDebug.advance(3.4));
  assert.equal(afterFall.misses, 1);
  assert.equal(afterFall.roofIndex, 0);
  assert.equal(afterFall.status, 'running');
  assert.ok(afterFall.elapsed > 5.5, 'A missed roof should cost time');
  await page.locator('#resetButton').click();
  assert.equal((await page.evaluate(() => window.__rooftopDebug.state())).elapsed, 0);

  await page.keyboard.down('d');
  const steered = await page.evaluate(() => window.__rooftopDebug.advance(.35));
  await page.keyboard.up('d');
  assert.ok(steered.x > 1, 'D should steer right');
  await page.keyboard.press('Space');
  const jumped = await page.evaluate(() => window.__rooftopDebug.advance(.1));
  assert.ok(jumped.y > 18.5 && !jumped.grounded, 'Space should jump');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__rooftopDebug.reset());
  assert.equal(await page.locator('.mobile-steer').isVisible(), true);
  const leftButton = await page.locator('#steerLeft').boundingBox();
  await page.mouse.move(leftButton.x + leftButton.width / 2, leftButton.y + leftButton.height / 2);
  await page.mouse.down();
  const mobileSteer = await page.evaluate(() => window.__rooftopDebug.advance(.3));
  await page.mouse.up();
  assert.ok(mobileSteer.x < -1, 'Touch steering should move left');
  await page.locator('#jumpButton').click();
  const mobileJump = await page.evaluate(() => window.__rooftopDebug.advance(.1));
  assert.ok(mobileJump.y > 18.5, 'The on-screen jump button should work');

  await page.evaluate(() => window.__rooftopDebug.reset());
  const timeout = await page.evaluate(() => window.__rooftopDebug.advance(41));
  assert.equal(timeout.status, 'lost');
  assert.equal(await page.locator('#resultTitle').textContent(), 'SO CLOSE. GO AGAIN.');
  await page.locator('#runAgain').click();
  assert.equal((await page.evaluate(() => window.__rooftopDebug.state())).status, 'running');
  assert.deepEqual(browserErrors, []);
  console.log('Passed: eight jumps, seven checkpoints, billboard, fall recovery, timer, reset, keyboard, and touch controls.');
} finally {
  await browser?.close();
  await server.close();
}
