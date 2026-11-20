import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const frontend = resolve(import.meta.dirname, '..');
const repository = resolve(frontend, '..');
const sourcePrefix = 'Frontend/source-assets/homepage/models/';
const docsPrefix = 'Docs/design/homepage/stage-3/';
const inventoryPath = join(repository, docsPrefix, 'archive-inventory.csv');
const inventoryRows = readFileSync(inventoryPath, 'utf8')
  .trimEnd()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [archivePath, repositoryPath, category, byteCount, digest] = line.split(',');
    return {
      archivePath,
      repositoryPath,
      category,
      byteCount: Number(byteCount),
      digest,
    };
  });
const expectedCounts = {
  'editable-model-source': 322,
  'model-export': 322,
  'catalog-specification': 4,
  'documentation-render': 28,
};
const actualCounts = new Map();
const seenArchivePaths = new Set();
const seenRepositoryPaths = new Set();

if (inventoryRows.length !== 676)
  throw new Error('Stage 3 archive inventory must contain 676 files.');

for (const row of inventoryRows) {
  if (
    !row.archivePath ||
    row.archivePath.includes('\\') ||
    row.archivePath.startsWith('/') ||
    row.archivePath.split('/').includes('..') ||
    !Number.isSafeInteger(row.byteCount) ||
    row.byteCount < 0 ||
    !/^[0-9a-f]{64}$/.test(row.digest)
  ) {
    throw new Error(`Invalid Stage 3 inventory row: ${row.archivePath}`);
  }
  if (seenArchivePaths.has(row.archivePath) || seenRepositoryPaths.has(row.repositoryPath)) {
    throw new Error(`Duplicate Stage 3 inventory entry: ${row.archivePath}`);
  }
  seenArchivePaths.add(row.archivePath);
  seenRepositoryPaths.add(row.repositoryPath);
  actualCounts.set(row.category, (actualCounts.get(row.category) ?? 0) + 1);

  const expectedPrefix =
    row.category === 'editable-model-source' || row.category === 'model-export'
      ? sourcePrefix
      : docsPrefix;
  if (!row.repositoryPath.startsWith(expectedPrefix)) {
    throw new Error(`Stage 3 file is stored in the wrong subsystem: ${row.repositoryPath}`);
  }

  const filePath = resolve(repository, row.repositoryPath);
  if (!filePath.startsWith(repository + sep)) {
    throw new Error(`Stage 3 inventory path escapes the repository: ${row.repositoryPath}`);
  }
  const bytes = readFileSync(filePath);
  if (
    bytes.length !== row.byteCount ||
    createHash('sha256').update(bytes).digest('hex') !== row.digest
  ) {
    throw new Error(`Stage 3 archive copy differs from its inventory: ${row.repositoryPath}`);
  }
  if (row.category === 'model-export') validateGlb(bytes, row.archivePath);
}

for (const [category, expectedCount] of Object.entries(expectedCounts)) {
  if (actualCounts.get(category) !== expectedCount) {
    throw new Error(`Expected ${expectedCount} Stage 3 ${category} files.`);
  }
}

const productionArchivePath = 'Room/Octagonal-Laundromat.glb';
const productionRow = inventoryRows.find((row) => row.archivePath === productionArchivePath);
if (!productionRow)
  throw new Error('The assembled octagonal room is missing from the archive inventory.');
const { document } = readGlb(resolve(repository, productionRow.repositoryPath));
const nodeNames = (document.nodes ?? []).map((node) => node.name);
const requiredNodes = [
  'Washer',
  'ProjectBoard',
  'Courier.Root',
  'Guide.Root',
  'Anchor.Board.Center',
  'Anchor.Board.TopLeft',
  'Anchor.Board.TopRight',
  'Anchor.Board.BottomLeft',
  'Anchor.Board.BottomRight',
  'Anchor.Washer.Preview',
  'Anchor.Washer.Open',
  'Anchor.Washer.Delete',
  'Anchor.Camera.Overview',
  'Anchor.Camera.Portrait',
  'Anchor.Camera.Board',
  'Anchor.Camera.Washer',
  'Anchor.Camera.Recenter',
  'Anchor.NicheLantern.Light',
];
if (
  requiredNodes.some((name) => nodeNames.filter((candidate) => candidate === name).length !== 1)
) {
  throw new Error('The assembled octagonal GLB is missing required scene nodes or anchors.');
}
const variantNames = (document.extensions?.KHR_materials_variants?.variants ?? [])
  .map((variant) => variant.name)
  .sort();
if (variantNames.join(',') !== 'Dark,Light,Minecraft,Raccoon') {
  throw new Error(`Unexpected Stage 3 material variants: ${variantNames.join(', ')}`);
}
if ((document.animations ?? []).length !== 0) {
  console.log('Stage 3 GLB has animation clips; the scene runtime does not depend on them.');
}

const distRuntime = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/runtime');
let runtimeSummary = 'Production output not checked because dist is absent.';
if (existsSync(distRuntime)) {
  const runtimeFiles = filesUnder(distRuntime);
  const productionRuntimePath = 'models/Room/Octagonal-Laundromat.glb';
  const productionRuntime = join(distRuntime, ...productionRuntimePath.split('/'));
  if (!existsSync(productionRuntime))
    throw new Error('Production room GLB is missing from Angular output.');
  if (
    createHash('sha256').update(readFileSync(productionRuntime)).digest('hex') !==
    productionRow.digest
  ) {
    throw new Error('Production room GLB differs from the inventoried export.');
  }
  const forbidden = runtimeFiles.filter((path) => /\.(blend|md|csv|json)$/i.test(path));
  const expectedJson = join(distRuntime, 'scene-manifest.json');
  if (forbidden.some((path) => path !== expectedJson)) {
    throw new Error('Editable models or documentation leaked into the production asset bundle.');
  }
  runtimeSummary = `Production GLB verified in the Angular runtime output (${statSync(productionRuntime).size} bytes; no Blender sources or documentation).`;
}

console.log(
  `Stage 3 archive verified: 676 inventoried files (322 Blender sources, 322 GLBs, 28 renders, and four catalog/specification files). ${runtimeSummary}`,
);

function readGlb(path) {
  const bytes = readFileSync(path);
  validateGlb(bytes, relative(repository, path));
  const jsonLength = bytes.readUInt32LE(12);
  return {
    bytes,
    document: JSON.parse(
      bytes
        .subarray(20, 20 + jsonLength)
        .toString('utf8')
        .replace(/\u0000+$/, '')
        .trimEnd(),
    ),
  };
}

function validateGlb(bytes, name) {
  if (
    bytes.length < 20 ||
    bytes.subarray(0, 4).toString('ascii') !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length ||
    bytes.readUInt32LE(16) !== 0x4e4f534a ||
    20 + bytes.readUInt32LE(12) > bytes.length
  ) {
    throw new Error(`Invalid glTF 2.0 binary asset: ${name}`);
  }
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
  });
}
