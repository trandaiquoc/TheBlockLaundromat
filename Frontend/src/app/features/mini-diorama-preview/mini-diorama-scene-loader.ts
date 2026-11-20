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
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';
import {
  MiniDioramaMaterialVariants,
  MiniDioramaMaterialsVariantsPlugin,
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
  readonly exteriorGroundTexture?: Texture;
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
  const contract = miniDioramaSceneContract(kind);
  const assetURL = new URL(contract.assetPath, baseURI);
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

  let exteriorGroundTexture: Texture | undefined;
  let replacementWasher: Group | undefined;
  let replacementWasherVariants: MiniDioramaMaterialVariants | undefined;
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
    if (kind === 'stage-3-production') {
      const profile = contract.profile;
      if (!profile) throw new Error('The production scene is missing its scene profile.');
      const washerURL = new URL(profile.washerAssetPath, baseURI);
      const washerResponse = await fetchAsset(washerURL, { signal });
      if (!washerResponse.ok) {
        throw new Error(`Could not load replacement washer (HTTP ${washerResponse.status}).`);
      }
      const washerLoader = new GLTFLoader();
      let washerVariantsPlugin: MiniDioramaMaterialsVariantsPlugin | undefined;
      washerLoader.register((parser) => {
        washerVariantsPlugin = new MiniDioramaMaterialsVariantsPlugin(parser);
        return washerVariantsPlugin;
      });
      const washerGltf = await washerLoader.parseAsync(
        await washerResponse.arrayBuffer(),
        new URL('.', washerURL).href,
      );
      replacementWasher = washerGltf.scene;
      replacementWasherVariants = washerVariantsPlugin?.materialVariants;
      if (!replacementWasherVariants) {
        throw new Error('The replacement washer GLB did not load its material variants.');
      }
      replacementWasher.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });
      if (signal.aborted) throw createAbortError();

      const oldWasher = gltf.scene.getObjectByName(miniDioramaSceneNodeName('Washer'));
      if (!oldWasher) throw new Error('The production room is missing its original washer.');
      oldWasher.visible = false;
      oldWasher.traverse((object) => {
        object.name = `Legacy.${object.name}`;
      });
      gltf.scene.add(replacementWasher);
    }
    assertRequiredSceneObjects(gltf.scene, kind);
    if (kind === 'stage-3-production') {
      const profile = contract.profile;
      if (!profile) throw new Error('The production scene is missing its scene profile.');
      exteriorGroundTexture = await loadExteriorGroundTexture(
        new URL(profile.exteriorGroundTexturePath, baseURI),
        signal,
        fetchAsset,
      );
    }
    if (signal.aborted) throw createAbortError();
    return {
      kind,
      root: gltf.scene,
      materialVariants: replacementWasherVariants
        ? MiniDioramaMaterialVariants.combine(materialVariants, replacementWasherVariants)
        : materialVariants,
      exteriorGroundTexture,
    };
  } catch (error) {
    exteriorGroundTexture?.dispose();
    closeImageBitmap(exteriorGroundTexture?.image);
    disposeParsedScene(gltf.scene, materialVariants);
    if (replacementWasher) {
      disposeParsedScene(replacementWasher, replacementWasherVariants);
    }
    throw error;
  }
}

function closeImageBitmap(image: unknown): void {
  if (
    typeof image !== 'object' ||
    image === null ||
    !('close' in image) ||
    typeof image.close !== 'function'
  ) {
    return;
  }
  image.close();
}

async function loadExteriorGroundTexture(
  textureURL: URL,
  signal: AbortSignal,
  fetchAsset: typeof fetch,
): Promise<Texture> {
  const response = await fetchAsset(textureURL, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the exterior ground texture (HTTP ${response.status}).`);
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
