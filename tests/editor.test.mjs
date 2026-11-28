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
  page.on('dialog', (dialog) => dialog.accept());
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

function menu(page, name) {
  return page.getByText(name, { exact: true }).and(page.locator('summary'));
}

async function addItem(page, type, color) {
  await menu(page, 'Add').click();
  if (type) await page.getByLabel('Item type').selectOption(type);
  if (color) await page.getByLabel('Add color').fill(color);
  await page.getByRole('button', { name: 'Add to scene', exact: true }).press('Enter');
}

async function upload(page, label, file) {
  await menu(page, 'File').click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: label, exact: true }).click();
  await (await chooser).setFiles(file);
}

async function deleteSelection(page) {
  await menu(page, 'Edit').click();
  await page.getByRole('button', { name: 'Delete selection' }).click();
}

test('App cleans up on StrictMode and remount, and follows the editor container', async (t) => {
  const page = await openEditor(t);
  assert.equal(await page.locator('.editor-host > canvas, .properties-panel, .transform-tools').count(), 3);
  assert.equal(await page.locator('#menu, .lil-gui').count(), 0);
  await page.evaluate(() => Object.assign(document.querySelector('.editor-host').style, {
    width: '640px', height: '350px', margin: '96px 0 0 120px',
  }));
  await page.waitForFunction(() => {
    const engine = window.current();
    return engine.camera.aspect === 640 / 350 && engine.renderer.domElement.width === 640 &&
      engine.renderer.domElement.height === 350;
  });
  await addItem(page);
  await page.mouse.click(130, 425);
  await page.waitForFunction(() => window.current().selectedObject === null);
  await page.mouse.click(440, 323);
  await page.waitForFunction(() => window.current().selectedObject?.name === 'cube');
  assert.equal(await page.locator('.selection-name').innerText(), 'Cube');
  await page.mouse.move(470, 323);
  await page.mouse.down();
  await page.waitForFunction(() => window.current().transformControls.dragging && !window.current().controls.enabled);
  await page.mouse.move(525, 323, { steps: 4 });
  await page.mouse.up();
  await page.waitForFunction(() => window.current().selectedObject.position.x > 0 && window.current().controls.enabled);
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="Position X"]').value) > 0);
  await page.keyboard.press('f');
  assert.equal(await page.evaluate(() => window.current().controls.target.x === window.current().selectedObject.position.x), true);

  await page.evaluate(() => window.current().controls.target.set(0, 0, 0));
  await menu(page, 'View').click();
  await page.getByRole('button', { name: 'Focus selection' }).click();
  assert.equal(await page.evaluate(() => window.current().controls.target.x === window.current().selectedObject.position.x), true);
  await page.evaluate(() => window.unmountEditor());
  assert.equal(await page.locator('canvas, .properties-panel').count(), 0);
  const frames = await page.evaluate(() => window.engines.map((record) => record.frames));
  await page.keyboard.press('g');
  assert.deepEqual(await page.evaluate(() => window.engines.map(({ engine, geometryDisposals }) => [
    engine.config.GRID_VISIBLE, geometryDisposals, engine.renderer.getContext().isContextLost(),
  ])), [[true, 1, true], [true, 1, true]]);
  await page.evaluate(() => window.mountEditor());
  await page.waitForFunction(() => window.engines.length === 4 && window.engines[3].frames > 0);
  assert.deepEqual(await page.evaluate(() => window.engines.slice(0, 2).map(({ frames }) => frames)), frames);
  await page.locator('canvas').press('g');
  await page.waitForFunction(() => !window.current().gridHelper.visible);
  await addItem(page);
  assert.equal(await page.evaluate(() => window.current().transformControls.object.name), 'cube');
});

test('editor commands preserve camera, selection, shapes, lights and local files', async (t) => {
  const page = await openEditor(t);
  const types = ['cube', 'sphere', 'cylinder', 'cone', 'plane', 'pointLight', 'spotLight', 'directionalLight', 'ambientLight'];
  for (const type of types) {
    await addItem(page, type);
    assert.equal(await page.evaluate(() => window.current().transformControls.object.name), type);
    if (type === 'pointLight') {
      await page.mouse.click(210, 720);
      const light = await page.evaluate(() => {
        const editor = window.current();
        const { x, y } = editor.scene.getObjectByName('pointLight').position.clone().project(editor.camera);
        const bounds = editor.renderer.domElement.getBoundingClientRect();
        return { x: bounds.left + (x + 1) * bounds.width / 2, y: bounds.top + (1 - y) * bounds.height / 2 };
      });
      await page.mouse.click(light.x, light.y);
      await page.waitForFunction(() => window.current().selectedObject?.name === 'pointLight');
      const intensity = page.getByLabel('Intensity', { exact: true });
      await intensity.fill('60');
      assert.equal(await page.evaluate(() => window.current().selectedObject.intensity), 60);
    }
  }

  await page.mouse.click(210, 720);
  await page.waitForFunction(() => window.current().selectedObject === null);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => window.current().selectedObject?.name), 'pointLight');
  assert.equal(await page.locator('.selection-name').innerText(), 'Point light');
  await page.locator('canvas').focus();
  for (const [key, mode] of [['r', 'rotate'], ['s', 'scale'], ['t', 'translate']]) {
    await page.keyboard.press(key);
    await page.waitForFunction((mode) => window.current().transformControls.mode === mode, mode);
    const label = { rotate: 'Rotate', scale: 'Scale', translate: 'Move' }[mode];
    await page.getByRole('button', { name: label, pressed: true }).waitFor();
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

  await upload(page, 'Import FBX', resolve('tests/fixtures/triangle.fbx'));
  await page.waitForFunction(() => window.current().scene.getObjectByName('FBX_Object')?.getObjectByName('Triangle')?.isMesh);

  await menu(page, 'File').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save THRL', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'scene.thrl');
  const saved = JSON.parse(await readFile(await download.path(), 'utf8'));
  const names = saved.object.children.map(({ name }) => name);
  for (const name of [...types, 'FBX_Object', 'ThrlenderCamera', 'ThrlenderSkyLight']) assert.ok(names.includes(name), name);
  for (const name of ['ThrlenderAxesHelper', 'ThrlenderGridHelper', 'ThrlenderTransformControls']) {
    assert.ok(!names.includes(name));
  }
  assert.equal(await page.evaluate(() => window.current().gridHelper.parent === window.current().scene), true);

  await page.locator('canvas').press('r');
  await page.waitForFunction(() => window.current().transformControls.mode === 'rotate');
  await upload(page, 'Open THRL', {
    name: 'replacement.thrl',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      ...saved,
      object: {
        ...saved.object,
        name: 'Replacement',
        children: [
          ...saved.object.children.filter(({ name }) => name === 'cube'),
          { uuid: 'old-helper', type: 'PointLightHelper', name: 'pointLightHelper' },
        ],
      },
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
  assert.equal(await page.locator('.selection-name').count(), 0);
  assert.equal(await page.evaluate(() => window.current().transformControls.object === undefined), true);
  assert.deepEqual(await page.locator('.scene-select').allTextContents(), ['Cube']);
  await page.mouse.click(210, 720);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => window.current().selectedObject?.name), 'cube');
  await deleteSelection(page);
  await upload(page, 'Import FBX', resolve('tests/fixtures/triangle.fbx'));
  await page.waitForFunction(() => window.current().scene.getObjectByName('FBX_Object'));
  await page.locator('canvas').press('Tab');
  assert.equal(await page.locator('.selection-name').innerText(), 'FBX_Object');
  assert.equal(await page.getByLabel('Position X').inputValue(), '0');
  assert.equal(await page.getByLabel('Scale X').inputValue(), '1');
  assert.equal(await page.getByLabel('Color', { exact: true }).count(), 0);
});

test('properties and scene settings stay synchronized without capturing interface keys', async (t) => {
  const page = await openEditor(t);
  await addItem(page, 'cube', '#4a86d2');
  assert.equal(await page.locator('.selection-name').innerText(), 'Cube');
  assert.equal(await page.getByLabel('Color', { exact: true }).inputValue(), '#4a86d2');
  const position = page.getByLabel('Position X');
  await position.fill('2.5');
  for (const key of ['t', 'r', 's', 'Space']) await position.press(key);
  assert.equal(await page.getByRole('button', { name: 'Gizmo', pressed: true }).count(), 1);
  await position.press('Tab');
  assert.equal(await page.getByLabel('Position Y').evaluate((input) => input === document.activeElement), true);
  assert.equal(await page.getByLabel('Position Y').evaluate((input) => input.matches(':focus-visible')), true);
  assert.equal(await page.getByRole('button', { name: 'Move' }).getAttribute('aria-pressed'), 'true');
  await page.getByLabel('Scale Z').fill('1.75');
  await page.getByLabel('Color', { exact: true }).fill('#afff11');
  assert.deepEqual(await page.evaluate(() => {
    const { position, scale, material } = window.current().selectedObject;
    return [position.x, scale.z, material.color.getHexString()];
  }), [2.5, 1.75, 'afff11']);
  await deleteSelection(page);
  assert.equal(await page.locator('.selection-name').count(), 0);

  await menu(page, 'View').press('Enter');
  await page.getByLabel('Show light helpers').uncheck();
  await page.getByLabel('Sky intensity').press('End');
  await page.getByLabel('Sky color').fill('#dfe7ff');
  await page.getByLabel('Ground color').fill('#334455');
  await page.waitForFunction(() => {
    const { skyLight, scene } = window.current();
    return skyLight.intensity === 2 && skyLight.color.getHexString() === 'dfe7ff' &&
      skyLight.groundColor.getHexString() === '334455' && !scene.getObjectByName('ThrlenderSkyLightHelper').visible;
  });
  await menu(page, 'View').press('Enter');

  await addItem(page, 'spotLight');
  await page.getByLabel('Distance', { exact: true }).fill('65');
  await page.getByLabel('Decay', { exact: true }).fill('1.5');
  assert.deepEqual(await page.evaluate(() => {
    const { selectedObject, scene } = window.current();
    return [selectedObject.distance, selectedObject.decay, scene.getObjectByName('spotLightHelper').visible];
  }), [65, 1.5, false]);
  await deleteSelection(page);
  assert.equal(await page.evaluate(() => !!window.current().scene.getObjectByName('spotLightHelper')), false);
  await addItem(page, 'ambientLight');
  assert.equal(await page.getByLabel('Distance', { exact: true }).count(), 0);
  assert.equal(await page.getByLabel('Decay', { exact: true }).count(), 0);

  await menu(page, 'View').press('Enter');
  await page.getByLabel('Grid color').fill('#4288dd');
  await page.getByLabel('Camera damping').uncheck();
  await page.locator('canvas').press('g');
  await page.locator('canvas').press('a');
  await page.locator('canvas').press('w');
  await page.waitForFunction(() => {
    const { gridHelper, axesHelper, controls, config } = window.current();
    return !gridHelper.visible && !axesHelper.visible && !controls.enableDamping && config.WIREFRAME_MODE &&
      gridHelper.geometry.getAttribute('color').getX(0) < 0.06;
  });
  await menu(page, 'View').click();
  assert.equal(await page.getByLabel('Show grid').isChecked(), false);
  assert.equal(await page.getByLabel('Show axes').isChecked(), false);
  await page.getByRole('checkbox', { name: 'Wireframe', checked: true }).waitFor();
  await page.getByRole('button', { name: 'Snap', pressed: true }).click();
  await page.waitForFunction(() => window.current().transformControls.translationSnap === null);
});

test('menus and transform tools stay accessible at desktop and mobile widths', async (t) => {
  const page = await openEditor(t);
  for (const width of [1000, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const viewport = page.locator('canvas');
    const inspector = page.getByRole('complementary', { name: 'Inspector' });
    const visible = await viewport.boundingBox();
    if (width === 390) assert.ok(visible.height > 500);
    else assert.ok(visible.width > 700);

    for (const name of ['File', 'Edit', 'Add', 'View']) {
      const trigger = menu(page, name);
      await trigger.press('Enter');
      const panel = page.locator('details[open] .menu-panel');
      const bounds = await panel.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, name);
      if (name !== 'Edit') await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      assert.equal(await panel.isVisible(), false);
      assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
    }

    await menu(page, 'View').click();
    await page.getByLabel('Show inspector').uncheck();
    assert.equal(await inspector.isVisible(), false);
    const expanded = await viewport.boundingBox();
    assert.ok(expanded.width > visible.width || expanded.height > visible.height);
    await page.getByLabel('Show inspector').check();
    assert.equal(await inspector.isVisible(), true);
    await page.mouse.click(100, 580);
    assert.equal(await page.locator('details[open]').count(), 0);

    const rotate = page.getByRole('button', { name: 'Rotate' });
    await rotate.hover();
    assert.equal(await rotate.locator('.tool-tooltip').innerText(), 'Rotate R');
    assert.equal(await rotate.getAttribute('aria-keyshortcuts'), 'R');
    await rotate.click();
    await page.waitForFunction(() => window.current().transformControls.mode === 'rotate');
    assert.equal(await rotate.getAttribute('aria-pressed'), 'true');
    await viewport.press('t');
    await page.getByRole('button', { name: 'Move', pressed: true }).waitFor();
  }
});

test('scene hierarchy follows viewport picking and preserves names and visibility through THRL', async (t) => {
  const page = await openEditor(t);
  const tree = page.getByRole('region', { name: 'Scene' });
  const row = (name) => tree.getByRole('button', { name, exact: true });
  const nameField = page.getByRole('textbox', { name: 'Name', exact: true });
  const visibility = page.getByRole('checkbox', { name: 'Visible', exact: true });

  await upload(page, 'Import FBX', resolve('tests/fixtures/triangle.fbx'));
  await row('Expand FBX_Object').press('Enter');
  await row('Triangle').press('Enter');
  assert.equal(await nameField.inputValue(), 'Triangle');
  assert.equal(await page.evaluate(() => window.current().transformControls.object?.name), 'Triangle');
  await nameField.fill('Front face');
  await row('Collapse FBX_Object').click();
  assert.equal(await row('Front face').count(), 0);
  await row('FBX_Object').click();

  const point = await page.evaluate(() => {
    const { scene, camera, renderer } = window.current();
    const mesh = scene.getObjectByName('Front face');
    const projected = mesh.localToWorld(mesh.position.clone().set(1 / 3, 1 / 3, 0)).project(camera);
    const bounds = renderer.domElement.getBoundingClientRect();
    return {
      x: bounds.left + (projected.x + 1) * bounds.width / 2,
      y: bounds.top + (1 - projected.y) * bounds.height / 2,
    };
  });
  // Turn the gizmo off so the click goes to the triangle underneath.
  await page.getByRole('button', { name: 'Gizmo', pressed: true }).click();
  await page.mouse.click(point.x, point.y);
  await tree.getByRole('button', { name: 'Front face', pressed: true }).waitFor();

  await row('FBX_Object').click();
  await nameField.fill('Model');
  await visibility.uncheck();
  assert.equal(await row('Front face').getAttribute('data-hidden'), 'true');
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => window.current().selectedObject === null);
  await row('Front face').click();
  assert.equal(await visibility.isChecked(), true);
  await visibility.uncheck();

  await row('Sky light').click();
  await nameField.fill('Dusk');
  await visibility.uncheck();
  await addItem(page, 'pointLight');
  await nameField.fill('Fill');
  await visibility.uncheck();
  assert.equal(await page.evaluate(() => {
    const engine = window.current();
    return [...engine.lightHelpers].every((helper) => !helper.visible);
  }), true);
  assert.deepEqual(await tree.locator('.scene-select').allTextContents(), ['Dusk', 'Model', 'Front face', 'Fill']);

  await menu(page, 'File').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save THRL', exact: true }).click();
  const download = await downloadPromise;
  await row('Collapse Model').click();
  await upload(page, 'Open THRL', await download.path());
  await page.waitForFunction(() => window.current().selectedObject === null);
  await row('Expand Model').click();
  for (const name of ['Model', 'Front face', 'Dusk', 'Fill']) {
    await row(name).click();
    assert.equal(await nameField.inputValue(), name);
    assert.equal(await visibility.isChecked(), false);
  }
  assert.equal(await page.evaluate(() => window.current().skyLight?.name), 'Dusk');
  await visibility.check();
  assert.equal(await page.evaluate(() => {
    const engine = window.current();
    return [...engine.lightHelpers].find(({ light }) => light.name === 'Fill')?.visible;
  }), true);
  await row('Model').click();
  await deleteSelection(page);
  assert.equal(await row('Model').count(), 0);
  assert.equal(await row('Front face').count(), 0);
});
