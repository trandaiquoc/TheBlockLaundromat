import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Material, Mesh, type Group } from 'three';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';
import {
  MiniDioramaMaterialsVariantsPlugin,
  type MiniDioramaMaterialVariants,
} from './mini-diorama-material-variants';
import {
  miniDioramaSceneContract,
  miniDioramaSceneNodeName,
  requiredMiniDioramaSceneNodes,
  type MiniDioramaSceneKind,
} from './mini-diorama-scene-contract';

export interface MiniDioramaSceneAsset {
  readonly kind: MiniDioramaSceneKind;
  readonly root: Group;
  readonly materialVariants: MiniDioramaMaterialVariants;
}

export type MiniDioramaSceneAssetLoader = (
  baseURI: string,
  signal: AbortSignal,
  kind: MiniDioramaSceneKind,
) => Promise<MiniDioramaSceneAsset>;

export async function loadMiniDioramaSceneAsset(
  baseURI: string,
  signal: AbortSignal,
  kind: MiniDioramaSceneKind = 'integration-preview',
  fetchAsset: typeof fetch = globalThis.fetch,
): Promise<MiniDioramaSceneAsset> {
  const assetURL = new URL(miniDioramaSceneContract(kind).assetPath, baseURI);
  const response = await fetchAsset(assetURL, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the ${kind} scene (HTTP ${response.status}).`);
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
      throw new Error('The scene GLB did not load its material variants.');
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
          throw new Error('The scene GLB contains an unsupported mesh material.');
        }
      }
    });

    if (meshes.length === 0) {
      throw new Error('The scene GLB has no mesh geometry to render.');
    }
    assertRequiredSceneObjects(gltf.scene, kind);
    return { kind, root: gltf.scene, materialVariants };
  } catch (error) {
    disposeParsedScene(gltf.scene, materialVariants);
    throw error;
  }
}

function assertRequiredSceneObjects(root: Group, kind: MiniDioramaSceneKind): void {
  const contract = miniDioramaSceneContract(kind);
  for (const name of requiredMiniDioramaSceneNodes(contract)) {
    const loadedName = miniDioramaSceneNodeName(name);
    if (!root.getObjectByName(loadedName)) {
      throw new Error(`The ${kind} GLB is missing its '${name}' scene object or anchor.`);
    }
  }

  const raccoonRoots = contract.raccoonRoots;
  for (const name of raccoonRoots) {
    let matches = 0;
    const loadedName = miniDioramaSceneNodeName(name);
    root.traverse((object) => {
      if (object.name === loadedName) matches++;
    });
    if (matches !== 1) {
      throw new Error(`The ${kind} GLB must contain exactly one '${name}' character root.`);
    }
  }
}

function disposeParsedScene(
  root: Group,
  materialVariants: MiniDioramaMaterialVariants | undefined,
): void {
  disposeMiniDioramaResources(root, materialVariants?.ownedMaterials);
}

function createAbortError(): DOMException {
  return new DOMException('The mini-diorama scene load was cancelled.', 'AbortError');
}
