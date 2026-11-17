import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const frontend = resolve(import.meta.dirname, '..');
const repository = resolve(frontend, '..');
const source = join(frontend, 'source-assets/homepage');
const manifestPath = join(source, 'scene-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const expectedThemes = {
  minecraft: 'reference/01-minecraft.png',
  light: 'reference/02-light.png',
  raccoon: 'reference/03-raccoon.png',
  dark: 'reference/04-dark.png',
};
const expectedLayerCounts = { minecraft: 82, light: 82, raccoon: 84, dark: 83 };
const expectedCanvas = { width: 1672, height: 941 };
const raccoonSourcePaths = [
  'models/raccoon/puddlepaw-raccoon.bbmodel',
  'models/raccoon/puddlepaw-fur-atlas.png',
  'models/raccoon/puddlepaw-raccoon.glb',
  'models/raccoon/README.md',
];
const raccoonRigNodes = [
  'body_pivot',
  'head_pivot',
  'foreleg_left',
  'foreleg_right',
  'tail_base',
  'tail_tip',
  'hindquarters',
];
const raccoonAnimations = ['greet', 'idle', 'sit'];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function sourcePath(path) {
  if (
    typeof path !== 'string' ||
    path.length === 0 ||
    path.includes('\\') ||
    path.startsWith('/') ||
    path.split('/').includes('..')
  ) {
    throw new Error(`Invalid source asset path: ${path}`);
  }

  const resolved = resolve(source, path);
  if (!resolved.startsWith(source + sep)) throw new Error(`Source path escapes package: ${path}`);
  return resolved;
}

function readPng(path, expectedDimensions) {
  const bytes = readFileSync(path);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG: ${relative(source, path)}`);
  }

  const dimensions = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (
    expectedDimensions &&
    (dimensions.width !== expectedDimensions.width ||
      dimensions.height !== expectedDimensions.height)
  ) {
    throw new Error(
      `PNG dimensions differ: ${relative(source, path)} (${dimensions.width}x${dimensions.height})`,
    );
  }
  return { bytes, dimensions };
}

function readGlb(path) {
  const bytes = readFileSync(path);
  if (
    bytes.length < 20 ||
    bytes.subarray(0, 4).toString('ascii') !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length
  ) {
    throw new Error(`Invalid GLB header or length: ${relative(source, path)}`);
  }

  const jsonLength = bytes.readUInt32LE(12);
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength > bytes.length) {
    throw new Error(`GLB is missing its JSON document: ${relative(source, path)}`);
  }
  const document = JSON.parse(
    bytes
      .subarray(20, 20 + jsonLength)
      .toString('utf8')
      .replace(/\u0000+$/, '')
      .trimEnd(),
  );
  return { bytes, document };
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
  });
}

if (existsSync(join(frontend, 'public/assets/homepage/source'))) {
  throw new Error('Source package is still inside Angular public');
}
if (
  manifest.canvas?.width !== expectedCanvas.width ||
  manifest.canvas?.height !== expectedCanvas.height
) {
  throw new Error('Homepage manifest canvas dimensions changed unexpectedly');
}

const themes = Object.keys(manifest.themes ?? {}).sort();
if (themes.join(',') !== Object.keys(expectedThemes).sort().join(',')) {
  throw new Error(`Unexpected manifest themes: ${themes.join(', ')}`);
}

let layerCount = 0;
const manifestLayers = new Set();
const referencedMasks = new Set();
for (const [theme, expectedReference] of Object.entries(expectedThemes)) {
  const themeManifest = manifest.themes[theme];
  if (themeManifest.source !== expectedReference) {
    throw new Error(`Unexpected canonical reference path for ${theme}: ${themeManifest.source}`);
  }

  const referencePath = sourcePath(themeManifest.source);
  const { bytes: reference } = readPng(referencePath, expectedCanvas);
  const canonicalPath = join(
    repository,
    'Docs/design/references',
    expectedReference.split('/').at(-1),
  );
  const { bytes: canonical } = readPng(canonicalPath, expectedCanvas);
  if (sha256(reference) !== sha256(canonical)) throw new Error(`Reference differs: ${theme}`);

  if (
    !Array.isArray(themeManifest.assets) ||
    themeManifest.assets.length !== expectedLayerCounts[theme]
  ) {
    throw new Error(`Unexpected layer count for ${theme}`);
  }

  for (const asset of themeManifest.assets) {
    if (typeof asset.file !== 'string' || !asset.file.startsWith(`assets/${theme}/`)) {
      throw new Error(`Unexpected ${theme} layer path: ${asset.file}`);
    }
    if (manifestLayers.has(asset.file))
      throw new Error(`Duplicate manifest layer path: ${asset.file}`);
    manifestLayers.add(asset.file);
    const assetPath = sourcePath(asset.file);
    const { bytes, dimensions } = readPng(assetPath, {
      width: asset.width,
      height: asset.height,
    });
    if (sha256(bytes) !== asset.sha256) throw new Error(`Source hash differs: ${asset.file}`);
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      throw new Error(`Invalid layer dimensions: ${asset.file}`);
    }
    layerCount++;

    if (asset.mask !== undefined) {
      if (typeof asset.mask !== 'string' || !asset.mask.startsWith(`masks/${theme}/`)) {
        throw new Error(`Unexpected ${theme} mask path: ${asset.mask}`);
      }
      const maskPath = sourcePath(asset.mask);
      readPng(maskPath, expectedCanvas);
      referencedMasks.add(asset.mask);
    }
  }
}

const layerFiles = filesUnder(join(source, 'assets'));
const maskFiles = filesUnder(join(source, 'masks'));
const referenceFiles = filesUnder(join(source, 'reference'));
const sourceFiles = filesUnder(source);
const raccoonTexturePath = sourcePath('models/raccoon/puddlepaw-fur-atlas.png');
const { bytes: raccoonTexture } = readPng(raccoonTexturePath, { width: 64, height: 64 });
const raccoonModelPath = sourcePath('models/raccoon/puddlepaw-raccoon.bbmodel');
const raccoonModel = JSON.parse(readFileSync(raccoonModelPath, 'utf8'));
const embeddedRaccoonTexture = raccoonModel.textures?.find(
  (texture) => texture.name === 'puddlepaw_fur_atlas.png',
);
if (
  raccoonModel.meta?.model_format !== 'free' ||
  !Array.isArray(raccoonModel.elements) ||
  raccoonModel.elements.length === 0 ||
  !Array.isArray(raccoonModel.groups) ||
  raccoonRigNodes.some((name) => !raccoonModel.groups.some((group) => group.name === name)) ||
  raccoonModel.animations
    ?.map((animation) => animation.name)
    .sort()
    .join(',') !== raccoonAnimations.join(',') ||
  !embeddedRaccoonTexture?.source?.startsWith('data:image/png;base64,') ||
  embeddedRaccoonTexture.width !== 64 ||
  embeddedRaccoonTexture.height !== 64 ||
  sha256(Buffer.from(embeddedRaccoonTexture.source.split(',')[1], 'base64')) !==
    sha256(raccoonTexture)
) {
  throw new Error('Editable Raccoon source does not match its embedded texture or clip contract.');
}

const raccoonGlbPath = sourcePath('models/raccoon/puddlepaw-raccoon.glb');
const { bytes: raccoonGlb, document: raccoonGltf } = readGlb(raccoonGlbPath);
const raccoonNodeNames = new Set(raccoonGltf.nodes?.map((node) => node.name));
if (
  raccoonAnimations.some(
    (name) => !raccoonGltf.animations?.some((animation) => animation.name === name),
  ) ||
  raccoonRigNodes.some((name) => !raccoonNodeNames.has(name)) ||
  (raccoonGltf.images?.length ?? 0) !== 1 ||
  (raccoonGltf.meshes?.length ?? 0) === 0
) {
  throw new Error('Raccoon runtime GLB is missing its texture, geometry, rig nodes, or clips.');
}

const sourceLayerPaths = new Set(
  layerFiles.map((path) => relative(source, path).split(sep).join('/')),
);
const actualSourcePaths = new Set(
  sourceFiles.map((path) => relative(source, path).split(sep).join('/')),
);
const expectedSourcePaths = new Set([
  ...manifestLayers,
  ...maskFiles.map((path) => relative(source, path).split(sep).join('/')),
  ...referenceFiles.map((path) => relative(source, path).split(sep).join('/')),
  'scene-manifest.json',
  ...raccoonSourcePaths,
]);
const semanticIds = new Set(
  Object.values(manifest.themes).flatMap((theme) => theme.assets.map((asset) => asset.id)),
);
if (
  layerCount !== 331 ||
  layerFiles.length !== 331 ||
  manifestLayers.size !== 331 ||
  semanticIds.size !== 86 ||
  [...sourceLayerPaths].some((path) => !manifestLayers.has(path)) ||
  maskFiles.length !== 282 ||
  referenceFiles.length !== 4 ||
  referencedMasks.size !== 278 ||
  sourceFiles.length !== 622 ||
  actualSourcePaths.size !== expectedSourcePaths.size ||
  [...expectedSourcePaths].some((path) => !actualSourcePaths.has(path))
) {
  throw new Error('Homepage source package inventory changed unexpectedly');
}

for (const path of maskFiles) readPng(path, expectedCanvas);

const distSource = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/source');
if (existsSync(distSource)) throw new Error('Source package leaked into production dist');

const distRuntime = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/runtime');
let runtimeSummary = 'Production runtime packaging not checked because dist is absent.';
if (existsSync(distRuntime)) {
  const expectedRuntime = new Map();
  for (const theme of Object.values(manifest.themes)) {
    for (const asset of theme.assets) {
      if (asset.id === 'navigation' || asset.id === 'account') continue;
      expectedRuntime.set(asset.file, sourcePath(asset.file));
    }
  }
  expectedRuntime.set('models/raccoon/puddlepaw-raccoon.glb', raccoonGlbPath);
  const runtimeFiles = filesUnder(distRuntime);
  const actualRuntimePaths = new Set(
    runtimeFiles.map((path) => relative(distRuntime, path).split(sep).join('/')),
  );
  const expectedRuntimePaths = new Set([...expectedRuntime.keys(), 'scene-manifest.json']);
  if (
    actualRuntimePaths.size !== expectedRuntimePaths.size ||
    [...expectedRuntimePaths].some((path) => !actualRuntimePaths.has(path))
  ) {
    throw new Error('Production Homepage runtime contains missing or unexpected files.');
  }

  const runtimeManifest = readFileSync(join(distRuntime, 'scene-manifest.json'));
  if (sha256(runtimeManifest) !== sha256(readFileSync(manifestPath))) {
    throw new Error('Production Homepage runtime manifest differs from the source manifest.');
  }

  for (const [runtimePath, sourceAssetPath] of expectedRuntime) {
    const distAssetPath = join(distRuntime, ...runtimePath.split('/'));
    if (sha256(readFileSync(distAssetPath)) !== sha256(readFileSync(sourceAssetPath))) {
      throw new Error(`Production Homepage runtime asset differs from source: ${runtimePath}`);
    }
  }

  const runtimeBytes = runtimeFiles.reduce((total, path) => total + readFileSync(path).length, 0);
  runtimeSummary = `Production runtime verified: ${expectedRuntime.size - 1} required PNG layers, one authored Raccoon GLB, and manifest (${runtimeBytes} bytes; no editable model or texture sources).`;
}

console.log(
  `Homepage source assets: 331 layer SHA-256 hashes, 282 masks, 86 semantic IDs, four canonical references, and the editable 64x64 Raccoon source/texture/GLB contract verified. ${runtimeSummary}`,
);
