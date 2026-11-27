import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { build, resolveConfig } from 'vite';

const deployments = [
  {
    configFile: 'vite.config.js',
    outDir: resolve('dist'),
    asset: /(?:src|href)="\/ThrlenderJS\/assets\//,
  },
  {
    configFile: 'vite.config.prod.js',
    outDir: '/var/www/thrlender',
    asset: /(?:src|href)="\/assets\//,
  },
];

for (const { configFile, outDir, asset } of deployments) {
  test(`${configFile} bundles the React entry at its deployment path`, async () => {
    const options = { configFile, build: { write: false }, logLevel: 'silent' };
    const config = await resolveConfig(options, 'build');
    assert.equal(resolve(config.root, config.build.outDir), outDir);

    const { output } = await build(options);
    const html = output.find((file) => file.fileName === 'index.html')?.source;
    const assets = html?.match(/(?:src|href)="[^"]+"/g);
    assert.ok(assets?.some((reference) => reference.startsWith('src=')));
    assert.ok(assets?.some((reference) => reference.startsWith('href=')));
    for (const reference of assets) assert.match(reference, asset);
  });
}
