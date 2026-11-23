import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  Material,
  Mesh,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  type Group,
} from 'three';
import {
  LAUNDROMAT_DIORAMA_PROFILE,
  dioramaSceneNodeName,
  requiredDioramaSceneNodes,
  requiredDioramaWasherNodes,
} from './diorama-scene-profile';
import {
  combineDioramaMaterialVariants,
  DioramaMaterialsVariantsPlugin,
  type DioramaMaterialVariants,
} from './diorama-material-variants';
import { disposeDioramaResources } from './diorama-scene-resources';

export interface DioramaSceneAsset {
  readonly root: Group;
  readonly replacementWasher: Group;
  readonly materialVariants: DioramaMaterialVariants;
  readonly exteriorGroundTexture: Texture;
}

interface ParsedVariantScene {
  readonly root: Group;
  readonly materialVariants: DioramaMaterialVariants;
}

export type DioramaSceneAssetLoader = (
  baseURI: string,
  signal: AbortSignal,
) => Promise<DioramaSceneAsset>;

export async function loadDioramaSceneAsset(
  baseURI: string,
  signal: AbortSignal,
  fetchAsset: typeof fetch = globalThis.fetch,
): Promise<DioramaSceneAsset> {
  const profile = LAUNDROMAT_DIORAMA_PROFILE;
  const roomURL = new URL(profile.roomAssetPath, baseURI);
  const washerURL = new URL(profile.washerAssetPath, baseURI);
  const [roomBytes, washerBytes] = await Promise.all([
    fetchSceneBytes(roomURL, 'room', signal, fetchAsset),
    fetchSceneBytes(washerURL, 'replacement washer', signal, fetchAsset),
  ]);
  if (signal.aborted) throw createAbortError();

  const parsed = await Promise.allSettled([
    parseVariantScene(roomBytes, roomURL),
    parseVariantScene(washerBytes, washerURL),
  ]);
  const room = parsed[0].status === 'fulfilled' ? parsed[0].value : undefined;
  const washer = parsed[1].status === 'fulfilled' ? parsed[1].value : undefined;
  if (parsed.some((result) => result.status === 'rejected')) {
    if (room) disposeParsedScene(room.root, room.materialVariants);
    if (washer) disposeParsedScene(washer.root, washer.materialVariants);
    const failure = parsed.find((result) => result.status === 'rejected');
    throw failure?.status === 'rejected' ? failure.reason : new Error('Diorama assets failed.');
  }
  if (!room || !washer) throw new Error('The Diorama room or replacement washer was not parsed.');
  if (signal.aborted) {
    disposeParsedScene(room.root, room.materialVariants);
    disposeParsedScene(washer.root, washer.materialVariants);
    throw createAbortError();
  }

  let exteriorGroundTexture: Texture | undefined;
  try {
    assertRenderableScene(room.root);
    assertRequiredSceneObjects(room.root);
    assertRenderableScene(washer.root);
    assertRequiredWasherObjects(washer.root);
    exteriorGroundTexture = await loadExteriorGroundTexture(
      new URL(profile.exteriorGroundTexturePath, baseURI),
      signal,
      fetchAsset,
    );
    if (signal.aborted) throw createAbortError();
    return {
      root: room.root,
      replacementWasher: washer.root,
      materialVariants: combineDioramaMaterialVariants([
        room.materialVariants,
        washer.materialVariants,
      ]),
      exteriorGroundTexture,
    };
  } catch (error) {
    exteriorGroundTexture?.dispose();
    closeImageBitmap(exteriorGroundTexture?.image);
    disposeParsedScene(room.root, room.materialVariants);
    disposeParsedScene(washer.root, washer.materialVariants);
    throw error;
  }
}

async function fetchSceneBytes(
  url: URL,
  label: string,
  signal: AbortSignal,
  fetchAsset: typeof fetch,
): Promise<ArrayBuffer> {
  const response = await fetchAsset(url, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the Diorama ${label} (HTTP ${response.status}).`);
  }
  return response.arrayBuffer();
}

async function parseVariantScene(bytes: ArrayBuffer, assetURL: URL): Promise<ParsedVariantScene> {
  const loader = new GLTFLoader();
  let variantsPlugin: DioramaMaterialsVariantsPlugin | undefined;
  loader.register((parser) => {
    variantsPlugin = new DioramaMaterialsVariantsPlugin(parser);
    return variantsPlugin;
  });
  const gltf = await loader.parseAsync(bytes, new URL('.', assetURL).href);
  const materialVariants = variantsPlugin?.materialVariants;
  if (!materialVariants) {
    disposeDioramaResources(gltf.scene);
    throw new Error(`The Diorama asset '${assetURL.pathname}' did not load its material variants.`);
  }
  return { root: gltf.scene, materialVariants };
}

function assertRenderableScene(root: Group): void {
  let meshCount = 0;
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    meshCount++;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof Material)) {
        throw new Error('The Diorama room contains an unsupported mesh material.');
      }
    }
  });
  if (meshCount === 0) throw new Error('The Diorama room has no mesh geometry to render.');
}

function assertRequiredSceneObjects(root: Group): void {
  const profile = LAUNDROMAT_DIORAMA_PROFILE;
  for (const name of requiredDioramaSceneNodes(profile)) {
    if (!root.getObjectByName(dioramaSceneNodeName(name))) {
      throw new Error(`The Diorama room is missing its '${name}' scene object or anchor.`);
    }
  }

  for (const name of profile.nodeNames.characterRoots) {
    let matches = 0;
    const loadedName = dioramaSceneNodeName(name);
    root.traverse((object) => {
      if (object.name === loadedName) matches++;
    });
    if (matches !== 1) {
      throw new Error(`The Diorama room must contain exactly one '${name}' character root.`);
    }
  }
}

function assertRequiredWasherObjects(root: Group): void {
  for (const name of requiredDioramaWasherNodes()) {
    if (!root.getObjectByName(dioramaSceneNodeName(name))) {
      throw new Error(`The replacement washer is missing its '${name}' scene object or anchor.`);
    }
  }
}

async function loadExteriorGroundTexture(
  textureURL: URL,
  signal: AbortSignal,
  fetchAsset: typeof fetch,
): Promise<Texture> {
  const response = await fetchAsset(textureURL, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the Diorama ground texture (HTTP ${response.status}).`);
  }

  const bitmap = await createImageBitmap(await response.blob());
  if (signal.aborted) {
    bitmap.close();
    throw createAbortError();
  }

  const texture = new Texture(bitmap);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function closeImageBitmap(image: unknown): void {
  if (
    typeof image === 'object' &&
    image !== null &&
    'close' in image &&
    typeof image.close === 'function'
  ) {
    image.close();
  }
}

function disposeParsedScene(
  root: Group,
  materialVariants: DioramaMaterialVariants | undefined,
): void {
  disposeDioramaResources(root, materialVariants?.ownedMaterials);
}

function createAbortError(): DOMException {
  return new DOMException('The Diorama scene load was cancelled.', 'AbortError');
}
