import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const frontend = resolve(import.meta.dirname, '..');
const repository = resolve(frontend, '..');
const source = join(frontend, 'source-assets/homepage');
const runtime = join(frontend, 'public/assets/homepage/runtime');
const manifest = JSON.parse(readFileSync(join(source, 'scene-manifest.json'), 'utf8'));
const expectedDetails = [
  'washer-body',
  'washer-portal',
  'shelf-wood',
  'outside-door',
  'outside-window',
  'awning',
  'chalkboard',
  'vine-left',
  'board-top-vines',
  'basket-body',
  'raccoon-standing',
  'raccoon-seated',
];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const png = (path) => {
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
    throw new Error(`Invalid PNG: ${path}`);
  return bytes;
};
const countFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const path = join(directory, entry.name);
    return total + (entry.isDirectory() ? countFiles(path) : entry.isFile() ? 1 : 0);
  }, 0);

if (existsSync(join(frontend, 'public/assets/homepage/source')))
  throw new Error('Source package is still inside Angular public');
let layers = 0;
for (const [theme, themeManifest] of Object.entries(manifest.themes)) {
  const reference = png(join(source, themeManifest.source));
  const original = png(
    join(repository, 'Docs/design/references', themeManifest.source.split('/').at(-1)),
  );
  if (sha256(reference) !== sha256(original)) throw new Error(`Reference differs: ${theme}`);
  for (const asset of themeManifest.assets) {
    const bytes = png(join(source, asset.file));
    if (sha256(bytes) !== asset.sha256) throw new Error(`Source hash differs: ${asset.file}`);
    layers++;
  }
  for (const name of expectedDetails) {
    const originalDetail = png(join(source, 'assets', theme, `${name}.png`));
    const runtimeDetail = png(join(runtime, theme, `${name}.png`));
    if (sha256(originalDetail) !== sha256(runtimeDetail))
      throw new Error(`Runtime detail differs: ${theme}/${name}`);
  }
}
if (layers !== 331 || countFiles(source) !== 618 || countFiles(runtime) !== 48) {
  throw new Error('Homepage source/runtime inventory changed unexpectedly');
}
const dist = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage');
if (existsSync(dist) && existsSync(join(dist, 'source')))
  throw new Error('Source package leaked into production dist');
console.log(
  'Homepage assets: 331 source layer hashes, 4 canonical references, 48 runtime PNGs, and production exclusion verified.',
);
