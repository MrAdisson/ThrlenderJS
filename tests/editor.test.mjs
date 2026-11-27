import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { build } from 'vite';

let browser;
let files;
let html;

before(async () => {
  const { output } = await build({
    configFile: 'vite.config.js',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    build: {
      write: false,
      sourcemap: false,
      rollupOptions: { input: resolve('tests/fixtures/editor.tsx') },
    },
  });
  files = new Map(output.map((file) => ['/' + file.fileName, file.code ?? file.source]));
  const css = output.find((file) => file.fileName.endsWith('.css')).fileName;
  const js = output.find((file) => file.isEntry).fileName;
  html = `<!doctype html><link rel="stylesheet" href="/${css}"><div id="root"></div>
    <script type="module" src="/${js}"></script>`;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
  });
});

after(async () => browser?.close());

async function openEditor(t) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  t.after(async () => {
    await page.close();
    assert.deepEqual(errors, []);
  });
  await page.route('http://editor.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const contentType = pathname.endsWith('.css') ? 'text/css' : 'text/javascript';
    if (pathname === '/') await route.fulfill({ contentType: 'text/html', body: html });
    else if (files.has(pathname)) await route.fulfill({ contentType, body: files.get(pathname) });
    else await route.fulfill({ status: 404 });
  });
  await page.goto('http://editor.test/');
  await page.evaluate(() => window.mountEditor());
  await page.waitForFunction(() => window.engines.length === 2 && window.engines[1].frames > 0);
  return page;
}

test('App cleans up on StrictMode and remount, and follows the editor container', async (t) => {
  const page = await openEditor(t);
  assert.equal(await page.locator('.editor-host > canvas, .editor-host > #menu, .editor-host > .editor-settings').count(), 3);
  await page.evaluate(() => Object.assign(document.querySelector('.editor-host').style, {
    width: '640px', height: '350px', margin: '90px 0 0 120px',
  }));
  await page.waitForFunction(() => {
    const engine = window.current();
    return engine.camera.aspect === 640 / 350 && engine.renderer.domElement.width === 640 &&
      engine.renderer.domElement.height === 350;
  });
  await page.getByRole('button', { name: 'ADD', exact: true }).click();
  await page.mouse.click(130, 425);
  await page.waitForFunction(() => window.current().selectedObject === null);
  await page.mouse.click(440, 265);
  await page.waitForFunction(() => window.current().selectedObject?.name === 'cube');
  await page.mouse.move(470, 265);
  await page.mouse.down();
  await page.waitForFunction(() => window.current().transformControls.dragging && !window.current().controls.enabled);
  await page.mouse.move(525, 265, { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction(() => window.current().selectedObject.position.x > 0 && window.current().controls.enabled);
  await page.keyboard.press('f');
  assert.equal(await page.evaluate(() => window.current().controls.target.x === window.current().selectedObject.position.x), true);

  await page.getByRole('button', { name: 'HIDE MENU' }).click();
  const showButton = await page.getByRole('button', { name: 'SHOW MENU' }).elementHandle();
  const hiddenMenu = await page.locator('#menu').elementHandle();
  const slider = page.locator('.editor-settings .controller').filter({ hasText: /^INTENSITY$/ }).locator('.slider');
  const sliderBounds = await slider.boundingBox();
  await page.mouse.move(sliderBounds.x + sliderBounds.width / 2, sliderBounds.y + sliderBounds.height / 2);
  await page.mouse.down();
  const intensity = await page.evaluate(() => window.current().config.LIGHTS_SKY_LIGHT_INTENSITY);
  await page.evaluate(() => window.unmountEditor());
  await page.mouse.move(0, 0);
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.current().config.LIGHTS_SKY_LIGHT_INTENSITY), intensity);
  await showButton.evaluate((button) => button.click());
  assert.equal(await hiddenMenu.evaluate((menu) => menu.style.display), 'none');
  assert.equal(await page.locator('canvas, #menu, .editor-settings').count(), 0);
  const frames = await page.evaluate(() => window.engines.map((record) => record.frames));
  await page.keyboard.press('g');
  assert.deepEqual(await page.evaluate(() => window.engines.map(({ engine, geometryDisposals }) => [
    engine.config.GRID_VISIBLE, geometryDisposals, engine.renderer.getContext().isContextLost(),
  ])), [[true, 1, true], [true, 1, true]]);
  await page.evaluate(() => window.mountEditor());
  await page.waitForFunction(() => window.engines.length === 4 && window.engines[3].frames > 0);
  assert.deepEqual(await page.evaluate(() => window.engines.slice(0, 2).map(({ frames }) => frames)), frames);
  await page.keyboard.press('g');
  await page.waitForFunction(() => !window.current().gridHelper.visible);
  await page.getByRole('button', { name: 'ADD', exact: true }).click();
  assert.equal(await page.evaluate(() => window.current().transformControls.object.name), 'cube');
});

test('editor commands preserve camera, selection, shapes, lights and local files', async (t) => {
  const page = await openEditor(t);
  const add = page.getByRole('button', { name: 'ADD', exact: true });
  const types = ['cube', 'sphere', 'cylinder', 'cone', 'plane', 'pointLight', 'spotLight', 'directionalLight', 'ambientLight'];
  for (const type of types) {
    await page.locator('#menu select').selectOption(type);
    await add.click();
    assert.equal(await page.evaluate(() => window.current().transformControls.object.name), type);
    if (type === 'pointLight') {
      await page.mouse.click(210, 720);
      const light = await page.evaluate(() => {
        const editor = window.current();
        const { x, y } = editor.scene.getObjectByName('pointLight').position.clone().project(editor.camera);
        return { x: (x + 1) * 500, y: (1 - y) * 400 };
      });
      await page.mouse.click(light.x, light.y);
      await page.waitForFunction(() => window.current().selectedObject?.name === 'pointLight');
      const intensity = page.locator('.controller').filter({ hasText: /^intensity$/ }).locator('input');
      await intensity.fill('60');
      assert.equal(await page.evaluate(() => window.current().selectedObject.intensity), 60);
    }
  }

  await page.mouse.click(210, 720);
  await page.waitForFunction(() => window.current().selectedObject === null);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => window.current().selectedObject?.name), 'ThrlenderSkyLightHelper');
  for (const [key, mode] of [['r', 'rotate'], ['s', 'scale'], ['t', 'translate']]) {
    await page.keyboard.press(key);
    await page.waitForFunction((mode) => window.current().transformControls.mode === mode, mode);
  }
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !window.current().transformControls.enabled);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.current().transformControls.enabled);

  const initialCamera = await page.evaluate(() => window.current().camera.position.toArray());
  await page.mouse.move(210, 650);
  await page.mouse.down();
  await page.mouse.move(300, 700, { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction((initial) => window.current().camera.position.toArray().some((v, i) => v !== initial[i]), initialCamera);
  const initialDistance = await page.evaluate(() => window.current().controls.getDistance());
  await page.mouse.wheel(0, -200);
  await page.waitForFunction((distance) => window.current().controls.getDistance() < distance, initialDistance);

  async function upload(label, file) {
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: label, exact: true }).click();
    await (await chooserPromise).setFiles(file);
  }

  await upload('loadFbx', resolve('tests/fixtures/triangle.fbx'));
  await page.waitForFunction(() => window.current().scene.getObjectByName('FBX_Object')?.getObjectByName('Triangle')?.isMesh);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'save', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'scene.thrl');
  const saved = JSON.parse(await readFile(await download.path(), 'utf8'));
  const names = saved.object.children.map(({ name }) => name);
  for (const name of [...types, 'FBX_Object', 'ThrlenderCamera', 'ThrlenderSkyLight']) assert.ok(names.includes(name), name);
  for (const name of ['ThrlenderAxesHelper', 'ThrlenderGridHelper', 'ThrlenderTransformControls']) {
    assert.ok(!names.includes(name));
  }
  assert.equal(await page.evaluate(() => window.current().gridHelper.parent === window.current().scene), true);

  await page.mouse.click(210, 720);
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.current().transformControls.mode === 'rotate');
  await upload('load', {
    name: 'replacement.thrl',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      ...saved,
      object: { ...saved.object, name: 'Replacement', children: saved.object.children.filter(({ name }) => name === 'cube') },
    })),
  });
  await page.waitForFunction(() => window.current().scene.name === 'Replacement');
  assert.deepEqual(await page.evaluate(() => {
    const editor = window.current();
    return [
      editor.scene.getObjectByName('cube').isMesh, !!editor.scene.getObjectByName('FBX_Object'),
      editor.transformControls.mode, editor.controls.object === editor.camera, editor.selectedObject,
      editor.scene.getObjectByName('ThrlenderGridHelper') === editor.gridHelper,
    ];
  }), [true, false, 'rotate', true, null, true]);
  await page.mouse.click(210, 720);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => window.current().selectedObject?.name), 'cube');
});
