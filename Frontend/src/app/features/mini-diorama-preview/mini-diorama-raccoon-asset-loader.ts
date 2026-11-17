import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  MeshStandardMaterial,
  NearestFilter,
  SRGBColorSpace,
  type AnimationClip,
  type Group,
  type Mesh,
} from 'three';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';

const raccoonAssetPath = 'assets/homepage/runtime/models/raccoon/puddlepaw-raccoon.glb';

export interface MiniDioramaRaccoonAsset {
  readonly root: Group;
  readonly animations: readonly AnimationClip[];
}

export type MiniDioramaRaccoonAssetLoader = (
  baseURI: string,
  signal: AbortSignal,
) => Promise<MiniDioramaRaccoonAsset>;

export async function loadMiniDioramaRaccoonAsset(
  baseURI: string,
  signal: AbortSignal,
): Promise<MiniDioramaRaccoonAsset> {
  const assetURL = new URL(raccoonAssetPath, baseURI);
  const response = await fetch(assetURL, { signal });
  if (!response.ok) {
    throw new Error(`Could not load the Raccoon model (HTTP ${response.status}).`);
  }

  const bytes = await response.arrayBuffer();
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(bytes, new URL('.', assetURL).href);
  let meshCount = 0;
  let textureCount = 0;
  gltf.scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    meshCount++;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial) || !material.map) continue;
      textureCount++;
      material.map.colorSpace = SRGBColorSpace;
      material.map.magFilter = NearestFilter;
      material.map.minFilter = NearestFilter;
      material.map.generateMipmaps = false;
      material.map.needsUpdate = true;
    }
  });
  if (meshCount === 0 || textureCount === 0) {
    disposeMiniDioramaResources(gltf.scene);
    throw new Error('The Raccoon GLB has no textured mesh to render.');
  }

  return { root: gltf.scene, animations: gltf.animations };
}
