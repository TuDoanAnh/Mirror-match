import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('https://bridge.playgama.com/**', route => route.fulfill({ body: '' }));

async function checkSceneResize(key) {
  // Include the design aspect ratio: Phaser auto-resizes cameras at (0, 0),
  // so moving away from this ratio also verifies our resize listener order.
  for (const [width, height] of [[1536, 1024], [1024, 768], [1280, 780], [1024, 1024], [600, 600]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(180);
    const viewport = await page.evaluate(key => {
      const game = arcaneGame;
      const camera = game.scene.getScene(key).cameras.main;
      return { x: camera.x, y: camera.y, width: camera.width, height: camera.height,
        expectedX: (game.scale.width - 1536) / 2, expectedY: (game.scale.height - 1024) / 2 };
    }, key);
    assert.equal(viewport.width, 1536, `${key}: ${JSON.stringify(viewport)}`);
    assert.equal(viewport.height, 1024, `${key}: ${JSON.stringify(viewport)}`);
    assert.ok(Math.abs(viewport.x - viewport.expectedX) < 0.01 && Math.abs(viewport.y - viewport.expectedY) < 0.01, `${key}: ${JSON.stringify(viewport)}`);
    assert.deepEqual(errors, [], `Resize after scene transitions: ${key}`);
  }
  console.log('Scene resize/restart PASS', key);
}

try {
  await page.goto('http://127.0.0.1:5173/?platformTest=1');
  await page.waitForFunction(() => window.arcaneGame?.scene.getScene('StartScene')?.children.list.some(child => child.texture?.key === 'btn_campaign'));
  for (const [width, height] of [[600, 600], [1024, 1024], [1024, 768], [1280, 720], [1920, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(350);
    const result = await page.evaluate(() => {
      const game = window.arcaneGame;
      const rect = game.canvas.getBoundingClientRect();
      const cam = game.scene.getScene('StartScene').cameras.main;
      return { width: rect.width, height: rect.height, vw: innerWidth, vh: innerHeight, x: cam.x, y: cam.y, cw: cam.width, ch: cam.height, gw: game.scale.width, gh: game.scale.height, overlay: !!document.querySelector('#rotate-screen-overlay') };
    });
    assert.ok(Math.abs(result.width - width) < 2 && Math.abs(result.height - height) < 2, JSON.stringify(result));
    assert.ok(result.x >= -1 && result.y >= -1 && result.x + result.cw <= result.gw + 1 && result.y + result.ch <= result.gh + 1, JSON.stringify(result));
    assert.equal(result.overlay, false);
    console.log('Viewport PASS', width, height, result.x, result.y);
  }
  await page.setViewportSize({ width: 600, height: 600 });
  await page.waitForTimeout(350);
  await page.evaluate(() => { localStorage.setItem('has_seen_tutorial', 'true'); platformTest.userMute(false); platformTest.audio(false); });
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  // Exercise an actual pointer hit with the centered camera.
  await page.mouse.click(618 * 600 / 1536, (256 + 687) * 600 / 1536);
  await page.waitForFunction(() => window.arcaneGame.scene.isActive('PreparationScene'));
  await checkSceneResize('PreparationScene');
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  await page.evaluate(() => { const s = arcaneGame.scene.getScene('PreparationScene'); s.scene.start('GameScene', { level: 1, mode: 'campaign' }); });
  await page.waitForFunction(() => window.arcaneGame.scene.getScene('GameScene')?.player?.active);
  await page.waitForTimeout(400);
  await page.mouse.move(140 * 600 / 1536, (256 + 820) * 600 / 1536);
  await page.mouse.down();
  await page.mouse.move(190 * 600 / 1536, (256 + 820) * 600 / 1536);
  assert.ok(await page.evaluate(() => arcaneGame.scene.getScene('GameScene').mobileControls.moveVector.x > 0.5));
  await page.mouse.up();
  assert.equal(await page.evaluate(() => arcaneGame.scene.getScene('GameScene').mobileControls.moveVector.x), 0);
  await page.evaluate(() => {
    const s = arcaneGame.scene.getScene('GameScene');
    s.testTweenTarget = { x: 0 };
    s.tweens.add({ targets: s.testTweenTarget, x: 100, duration: 5000 });
    s.testTimerDone = false;
    s.time.delayedCall(700, () => { s.testTimerDone = true; });
  });
  const before = await page.evaluate(() => {
    const s = arcaneGame.scene.getScene('GameScene');
    s.player.skills.Q.lastUsed = s.time.now;
    platformTest.pause(true);
    return { x: s.player.x, y: s.player.y, hp: s.player.hp, time: s.time.now, activeTime: platformTest.state().activeTime, remaining: s.player.skills.Q.lastUsed + s.player.skills.Q.cooldown - s.time.now };
  });
  await page.waitForTimeout(1300);
  const after = await page.evaluate(() => { const s = arcaneGame.scene.getScene('GameScene'); return { x: s.player.x, y: s.player.y, hp: s.player.hp, time: s.time.now, activeTime: platformTest.state().activeTime, remaining: s.player.skills.Q.lastUsed + s.player.skills.Q.cooldown - s.time.now }; });
  assert.deepEqual(after, before);
  assert.equal(await page.evaluate(() => arcaneGame.scene.getScene('GameScene').testTimerDone), false);
  await page.keyboard.press('q');
  assert.equal(await page.evaluate(() => arcaneGame.scene.getScene('GameScene').player.skills.Q.lastUsed + arcaneGame.scene.getScene('GameScene').player.skills.Q.cooldown - arcaneGame.scene.getScene('GameScene').time.now), before.remaining);
  await page.evaluate(() => { platformTest.ad('opened'); platformTest.pause(false); });
  assert.equal(await page.evaluate(() => platformTest.state().paused), true);
  await page.evaluate(() => platformTest.ad('closed'));
  assert.equal(await page.evaluate(() => platformTest.state().paused), false);
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  await page.waitForTimeout(150);
  const remaining = await page.evaluate(() => { const s = arcaneGame.scene.getScene('GameScene'); return s.player.skills.Q.lastUsed + s.player.skills.Q.cooldown - s.time.now; });
  assert.ok(remaining > before.remaining - 500, `${remaining} vs ${before.remaining}`);
  await page.evaluate(() => { platformTest.userMute(true); platformTest.audio(true); });
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  await page.evaluate(() => platformTest.userMute(false));
  assert.equal(await page.evaluate(() => platformTest.state().muted), false);
  assert.ok(await page.evaluate(() => arcaneGame.scene.getScene('GameScene').testTweenTarget.x < 20));
  // Freeze the match while verifying camera layout with earlier scenes shut down.
  await page.evaluate(() => platformTest.pause(true));
  await checkSceneResize('GameScene');
  await page.evaluate(() => platformTest.pause(false));
  for (const [key, data] of [['GameOverScene', { result: 'win', level: 1 }], ['AugmentSelectScene', { nextLevel: 2 }], ['StartScene', {}], ['PreparationScene', {}], ['StartScene', {}]]) {
    await page.evaluate(({ key, data }) => {
      const current = arcaneGame.scene.getScenes(true).find(scene => scene.sys.settings.key !== 'ViewportBackground');
      current.scene.start(key, data);
    }, { key, data });
    await page.waitForFunction(key => arcaneGame.scene.isActive(key), key);
    await page.waitForTimeout(450);
    await checkSceneResize(key);
  }
  assert.deepEqual(errors, []);
  console.log('Audio, pointer navigation, joystick, all scenes, pause overlap, gameplay/timer/tween freeze and cooldown PASS');
  await page.goto('http://127.0.0.1:5173/?platformTest=1&audio=0&paused=1');
  await page.waitForFunction(() => window.platformTest && window.arcaneGame);
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  assert.equal(await page.evaluate(() => platformTest.state().paused), true);
  await page.evaluate(() => platformTest.pause(false));
  await page.waitForFunction(() => window.arcaneGame.scene.getScene('StartScene')?.children.list.some(child => child.texture?.key === 'btn_campaign'));
  assert.equal(await page.evaluate(() => platformTest.state().muted), true);
  console.log('Initial disabled audio and initial pause PASS');
} finally {
  await browser.close();
}
