import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Material, Mesh, type Group } from 'three';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';
import {
  MiniDioramaMaterialsVariantsPlugin,
  type MiniDioramaMaterialVariants,
} from './mini-diorama-material-variants';

const laundromatAssetPath = 'assets/homepage/runtime/models/laundromat/Laundromat.glb';

export interface MiniDioramaSceneAsset {
  readonly root: Group;
  readonly materialVariants: MiniDioramaMaterialVariants;
}

export type MiniDioramaSceneAssetLoader = (
  baseURI: string,
  signal: AbortSignal,
) => Promise<MiniDioramaSceneAsset>;

export async function loadMiniDioramaSceneAsset(
  baseURI: string,
  signal: AbortSignal,
  fetchAsset: typeof fetch = globalThis.fetch,
): Promise<MiniDioramaSceneAsset> {
  const assetURL = new URL(laundromatAssetPath, baseURI);
  const response = await fetchAsset(assetURL, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the laundromat scene (HTTP ${response.status}).`);
  }

  const bytes = await response.arrayBuffer();
  if (signal.aborted) throw createAbortError();

  const loader = new GLTFLoader();
  let variantsPlugin: MiniDioramaMaterialsVariantsPlugin | undefined;
  loader.register((parser) => {
    variantsPlugin = new MiniDioramaMaterialsVariantsPlugin(parser);
    return variantsPlugin;
  });

  const gltf = await loader.parseAsync(bytes, new URL('.', assetURL).href);
  const materialVariants = variantsPlugin?.materialVariants;
  if (signal.aborted) {
    disposeParsedScene(gltf.scene, materialVariants);
    throw createAbortError();
  }

  try {
    if (!materialVariants) {
      throw new Error('The laundromat GLB did not load its material variants.');
    }

    const meshes: Mesh[] = [];
    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      meshes.push(object);
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof Material)) {
          throw new Error('The laundromat GLB contains an unsupported mesh material.');
        }
      }
    });

    if (meshes.length === 0) {
      throw new Error('The laundromat GLB has no mesh geometry to render.');
    }
    assertRequiredSceneObjects(gltf.scene);
    return { root: gltf.scene, materialVariants };
  } catch (error) {
    disposeParsedScene(gltf.scene, materialVariants);
    throw error;
  }
}

function assertRequiredSceneObjects(root: Group): void {
  for (const name of ['Washer', 'Notice_board', 'Raccoon']) {
    if (!root.getObjectByName(name)) {
      throw new Error(`The laundromat GLB is missing its '${name}' scene object.`);
    }
  }

  let raccoonCount = 0;
  root.traverse((object) => {
    if (object.name === 'Raccoon') raccoonCount++;
  });
  if (raccoonCount !== 1) {
    throw new Error('The laundromat GLB must contain exactly one Raccoon scene object.');
  }
}

function disposeParsedScene(
  root: Group,
  materialVariants: MiniDioramaMaterialVariants | undefined,
): void {
  disposeMiniDioramaResources(root, materialVariants?.ownedMaterials);
}

function createAbortError(): DOMException {
  return new DOMException('The laundromat scene load was cancelled.', 'AbortError');
}
