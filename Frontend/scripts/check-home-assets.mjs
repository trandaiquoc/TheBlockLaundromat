import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const frontend = resolve(import.meta.dirname, '..');
const repository = resolve(frontend, '..');
const source = join(frontend, 'source-assets/homepage');
const runtimeSource = new Map([
  ['diorama/Octagonal-Laundromat.glb', join(source, 'models/Room/Octagonal-Laundromat.glb')],
  ['diorama/forest-floor.png', join(source, 'textures/diorama/forest-floor.png')],
]);
const runtimeDirectory = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/diorama');
const profilePath = join(frontend, 'src/app/features/homepage/diorama/diorama-scene-profile.ts');
const profile = readFileSync(profilePath, 'utf8');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

for (const obsoletePath of [
  join(source, 'assets'),
  join(source, 'masks'),
  join(source, 'reference'),
  join(source, 'scene-manifest.json'),
  join(source, 'models/laundromat/Laundromat.glb'),
]) {
  if (existsSync(obsoletePath)) {
    throw new Error(
      `Retired Homepage asset remains in the source package: ${relative(source, obsoletePath)}`,
    );
  }
}
if (existsSync(join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/runtime'))) {
  throw new Error('Retired Homepage runtime directory remains in production output.');
}

for (const [runtimePath, sourcePath] of runtimeSource) {
  if (!existsSync(sourcePath)) throw new Error(`Diorama source asset is missing: ${sourcePath}`);
  if (!profile.includes(`assets/homepage/${runtimePath}`)) {
    throw new Error(`Diorama profile does not use assets/homepage/${runtimePath}.`);
  }
  const sourceBytes = readFileSync(sourcePath);
  if (runtimePath.endsWith('.glb')) validateRoomGlb(sourceBytes, runtimePath);
  else validatePng(sourceBytes, runtimePath);

  const outputPath = join(runtimeDirectory, ...runtimePath.split('/').slice(1));
  if (existsSync(join(frontend, 'dist/TheBlockLaundromat/browser/index.html'))) {
    if (!existsSync(outputPath))
      throw new Error(`Diorama runtime asset is missing: ${runtimePath}`);
    if (sha256(readFileSync(outputPath)) !== sha256(sourceBytes)) {
      throw new Error(`Diorama runtime asset differs from source: ${runtimePath}`);
    }
  }
}

const roomDocument = readGlb(readFileSync([...runtimeSource.values()][0])).document;
const requiredNodes = [
  'Washer',
  'ProjectBoard',
  'Courier.Root',
  'Guide.Root',
  'Anchor.NicheLantern.Light',
  'Anchor.ShelfLantern.Light',
  'Anchor.Board.Center',
  'Anchor.Board.BottomLeft',
  'Anchor.Board.BottomRight',
  'Anchor.Board.TopLeft',
  'Anchor.Board.TopRight',
  'Anchor.Camera.Overview',
  'Anchor.Camera.Washer',
  'Anchor.Camera.Board',
  'Anchor.Camera.Portrait',
  'Anchor.Camera.Recenter',
  'Anchor.Washer.Preview',
  'Anchor.Washer.Open',
  'Anchor.Washer.Delete',
  'LeftCabinet',
  'WestIvy',
  'ShelfFern',
  'ShelfLantern',
  'LinenBasket',
  'BasketBlueRoll',
  'BasketIvoryRoll',
  'SageWashBox',
  'OchreWashBox',
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
const nodes = roomDocument.nodes?.map((node) => node.name) ?? [];
if (requiredNodes.some((name) => nodes.filter((candidate) => candidate === name).length !== 1)) {
  throw new Error('The room GLB is missing a unique profile object or anchor.');
}

const variants = roomDocument.extensions?.KHR_materials_variants?.variants ?? [];
const variantNames = variants.map((variant) => variant?.name).sort();
const usedVariantIndices = new Set();
for (const mesh of roomDocument.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    for (const mapping of primitive.extensions?.KHR_materials_variants?.mappings ?? []) {
      for (const index of mapping.variants ?? []) usedVariantIndices.add(index);
    }
  }
}
if (
  variantNames.join(',') !== 'Dark,Light,Minecraft,Raccoon' ||
  usedVariantIndices.size !== variants.length ||
  [...usedVariantIndices].some(
    (index) => !Number.isInteger(index) || index < 0 || index >= variants.length,
  )
) {
  throw new Error('The room GLB is missing one or more used theme variants.');
}
const materialVariantsChangeCasterSilhouette = profile.match(
  /materialVariantsChangeCasterSilhouette:\s*(true|false)/,
)?.[1];
if (!materialVariantsChangeCasterSilhouette) {
  throw new Error('The Diorama profile must declare its theme shadow-silhouette contract.');
}
const nonOpaqueMaterials = (roomDocument.materials ?? []).filter((material) => {
  const alpha = material.pbrMetallicRoughness?.baseColorFactor?.[3];
  return (
    (material.alphaMode ?? 'OPAQUE') !== 'OPAQUE' ||
    (alpha !== undefined && alpha < 1) ||
    material.alphaTexture !== undefined
  );
});
const variantShadowSideChanges = [];
for (const mesh of roomDocument.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    const baseMaterial = roomDocument.materials?.[primitive.material] ?? {};
    const mappings = primitive.extensions?.KHR_materials_variants?.mappings ?? [];
    for (const mapping of mappings) {
      const variantMaterial = roomDocument.materials?.[mapping.material] ?? {};
      if (Boolean(baseMaterial.doubleSided) !== Boolean(variantMaterial.doubleSided)) {
        variantShadowSideChanges.push({ baseMaterial, variantMaterial });
      }
    }
  }
}
if (materialVariantsChangeCasterSilhouette === 'false' && nonOpaqueMaterials.length > 0) {
  throw new Error(
    'Diorama profile skips theme shadow updates, but the room GLB contains opacity-sensitive materials.',
  );
}
if (materialVariantsChangeCasterSilhouette === 'false' && variantShadowSideChanges.length > 0) {
  throw new Error(
    'Diorama shadow proxy uses one theme-independent side, but GLB material variants change sidedness.',
  );
}

let runtimeSummary = 'Production runtime packaging not checked because dist is absent.';
if (existsSync(runtimeDirectory)) {
  const expectedPaths = new Set(
    [...runtimeSource.keys()].map((path) => path.split('/').slice(1).join('/')),
  );
  const actualPaths = new Set(
    filesUnder(runtimeDirectory).map((path) =>
      relative(runtimeDirectory, path).split(sep).join('/'),
    ),
  );
  if (
    actualPaths.size !== expectedPaths.size ||
    [...expectedPaths].some((path) => !actualPaths.has(path))
  ) {
    throw new Error('Production Diorama runtime contains missing or unexpected files.');
  }
  const runtimeBytes = filesUnder(runtimeDirectory).reduce(
    (total, path) => total + readFileSync(path).length,
    0,
  );
  runtimeSummary = `Diorama runtime allowlist verified: ${runtimeBytes} bytes across one room GLB and one texture.`;
}

const sourceBytes = [...runtimeSource.values()].reduce(
  (total, path) => total + readFileSync(path).length,
  0,
);
const distRuntime = join(frontend, 'dist/TheBlockLaundromat/browser/assets/homepage/runtime');
if (existsSync(distRuntime))
  throw new Error('Obsolete Homepage PNG/model runtime was copied to dist.');
console.log(`Diorama profile assets verified: ${sourceBytes} source bytes; ${runtimeSummary}`);

function readGlb(bytes) {
  validateRoomGlb(bytes, 'room GLB');
  const jsonLength = bytes.readUInt32LE(12);
  return {
    document: JSON.parse(
      bytes
        .subarray(20, 20 + jsonLength)
        .toString('utf8')
        .replace(/\u0000+$/, '')
        .trimEnd(),
    ),
  };
}

function validateRoomGlb(bytes, name) {
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

function validatePng(bytes, name) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG runtime asset: ${name}`);
  }
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.isFile() ? [path] : [];
  });
}
