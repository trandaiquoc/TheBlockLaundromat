import * as THREE from 'three';
import type { WebGLRenderer } from 'three';

const disposedRoots = new WeakSet<THREE.Object3D>();

/** Owns one mounted scene's GPU assets and renderer lifetime. */
export class DioramaSceneResources {
  private renderer?: WebGLRenderer;
  private sceneRoot?: THREE.Object3D;
  private sceneMaterials: readonly THREE.Material[] = [];
  private disposed = false;

  trackRenderer(renderer: WebGLRenderer): void {
    if (this.disposed) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      return;
    }
    this.renderer = renderer;
  }

  trackScene(root: THREE.Object3D, additionalMaterials: readonly THREE.Material[] = []): void {
    if (this.disposed) {
      disposeDioramaResources(root, additionalMaterials);
      return;
    }
    this.sceneRoot = root;
    this.sceneMaterials = additionalMaterials;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.sceneRoot) disposeDioramaResources(this.sceneRoot, this.sceneMaterials);
    this.sceneRoot = undefined;
    this.sceneMaterials = [];
    const renderer = this.renderer;
    this.renderer = undefined;
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
  }
}

export function disposeDioramaResources(
  root: THREE.Object3D,
  additionalMaterials: readonly THREE.Material[] = [],
  additionalTextures: readonly THREE.Texture[] = [],
): void {
  if (disposedRoots.has(root)) return;
  disposedRoots.add(root);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>(additionalMaterials);
  const textures = new Set<THREE.Texture>(additionalTextures);
  const shadows = new Set<DisposableShadowResource>();
  const imageBitmaps = new Set<ClosableImageBitmap>();

  root.traverse((object) => {
    if ('shadow' in object && isDisposableShadowResource(object.shadow)) {
      shadows.add(object.shadow);
    }

    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of meshMaterials) materials.add(material);
  });

  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (isTexture(value)) textures.add(value);
    }
    if ('uniforms' in material && material.uniforms && typeof material.uniforms === 'object') {
      for (const uniform of Object.values(material.uniforms)) {
        const value = uniform?.value;
        if (isTexture(value)) textures.add(value);
        else if (Array.isArray(value)) {
          for (const texture of value) {
            if (isTexture(texture)) textures.add(texture);
          }
        }
      }
    }
  }

  for (const shadow of shadows) shadow.dispose();
  for (const texture of textures) {
    for (const image of textureImages(texture.image)) {
      if (isClosableImageBitmap(image)) imageBitmaps.add(image);
    }
    texture.dispose();
  }
  for (const bitmap of imageBitmaps) bitmap.close();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
  root.clear();
}

interface DisposableShadowResource {
  dispose(): void;
}

function isDisposableShadowResource(value: unknown): value is DisposableShadowResource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function'
  );
}

function isTexture(value: unknown): value is THREE.Texture {
  return (
    typeof value === 'object' && value !== null && 'isTexture' in value && value.isTexture === true
  );
}

interface ClosableImageBitmap {
  close(): void;
}

function textureImages(image: unknown): readonly unknown[] {
  return Array.isArray(image) ? image : [image];
}

function isClosableImageBitmap(image: unknown): image is ClosableImageBitmap {
  return (
    typeof image === 'object' &&
    image !== null &&
    'close' in image &&
    typeof image.close === 'function'
  );
}
