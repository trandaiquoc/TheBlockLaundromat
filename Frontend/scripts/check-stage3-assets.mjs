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
  'Anchor.ShelfLantern.Light',
  'LeftCabinet',
  'WestIvy',
  'ShelfFern',
  'ShelfLantern',
  'CabinetTowel1',
  'CabinetTowel2',
  'CabinetTowel3',
  'SeafoamPitcher',
  'CabinetBlueTin',
  'ApothecaryBottle',
  'CeramicPump',
  'LaundryLedger',
  'WrappedSoap',
  'CreamWashBox',
  'Marigold',
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

const distRuntime = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/diorama');
const replacementWasherPath = join(
  frontend,
  'source-assets/homepage/models/Props/Washer-Alternate/Washer.glb',
);
const replacementWasher = readFileSync(replacementWasherPath);
const replacementWasherDigest = createHash('sha256').update(replacementWasher).digest('hex');
if (
  replacementWasherDigest !== '717f3235659b94f65e5e0eea49ea425157df5f99c4c2cd42d0c1abd7b8b144b0'
) {
  throw new Error('Replacement washer GLB differs from the inspected Washer.zip asset.');
}
validateGlb(replacementWasher, 'Washer.zip:Washer.glb');
for (const sourceName of ['Washer.blend', 'Washer-Front.png']) {
  if (
    !existsSync(join(frontend, 'source-assets/homepage/models/Props/Washer-Alternate', sourceName))
  ) {
    throw new Error(`Washer.zip source asset is missing: ${sourceName}`);
  }
}
const groundTextureSource = join(
  frontend,
  'source-assets/homepage/textures/diorama/forest-floor.png',
);
const groundTextureBytes = readFileSync(groundTextureSource);
if (
  groundTextureBytes.length < 24 ||
  groundTextureBytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
) {
  throw new Error('The generated exterior forest-floor asset is not a PNG.');
}
const groundTextureDigest = createHash('sha256').update(groundTextureBytes).digest('hex');
const groundTextureRuntimePath = 'forest-floor.png';
let runtimeSummary = 'Production output not checked because dist is absent.';
if (existsSync(distRuntime)) {
  const runtimeFiles = filesUnder(distRuntime);
  const productionRuntimePath = 'Octagonal-Laundromat.glb';
  const productionRuntime = join(distRuntime, ...productionRuntimePath.split('/'));
  if (!existsSync(productionRuntime))
    throw new Error('Production room GLB is missing from Angular output.');
  if (
    createHash('sha256').update(readFileSync(productionRuntime)).digest('hex') !==
    productionRow.digest
  ) {
    throw new Error('Production room GLB differs from the inventoried export.');
  }
  const groundTextureRuntime = join(distRuntime, ...groundTextureRuntimePath.split('/'));
  if (
    !existsSync(groundTextureRuntime) ||
    createHash('sha256').update(readFileSync(groundTextureRuntime)).digest('hex') !==
      groundTextureDigest
  ) {
    throw new Error(
      'Generated exterior forest-floor texture is missing or differs from its source.',
    );
  }
  const expectedRuntimePaths = new Set([productionRuntimePath, groundTextureRuntimePath]);
  const actualRuntimePaths = new Set(
    runtimeFiles.map((path) => relative(distRuntime, path).split(sep).join('/')),
  );
  if (
    actualRuntimePaths.size !== expectedRuntimePaths.size ||
    [...expectedRuntimePaths].some((path) => !actualRuntimePaths.has(path))
  ) {
    throw new Error('The Diorama runtime bundle contains missing or unexpected files.');
  }
  runtimeSummary = `Single assembled room GLB and forest-floor texture verified in Angular output (${statSync(productionRuntime).size} GLB bytes; alternate washer Blender source contract remains archived but is not shipped).`;
}

console.log(
  `Room asset archive verified: 676 inventoried files (322 Blender sources, 322 GLBs, 28 renders, and four catalog/specification files); alternate washer source contract remains intact. ${runtimeSummary}`,
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
