import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';

describe('mini diorama scene resources', () => {
  it('disposes shared materials and geometry once, then clears the scene', () => {
    const { scene } = buildMiniDioramaScene();
    const raccoonTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    const raccoonMaterial = new THREE.MeshStandardMaterial({ map: raccoonTexture });
    const raccoonMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), raccoonMaterial);
    const raccoonAnchor = scene.getObjectByName('laundromat-raccoon');
    if (!raccoonAnchor) throw new Error('Raccoon scene anchor was not built.');
    raccoonAnchor.add(raccoonMesh);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    });
    const geometryDisposals = [...geometries].map((geometry) => vi.spyOn(geometry, 'dispose'));
    const materialDisposals = [...materials].map((material) => vi.spyOn(material, 'dispose'));
    const textureDisposals = [...textures].map((texture) => vi.spyOn(texture, 'dispose'));

    disposeMiniDioramaResources(scene);
    disposeMiniDioramaResources(scene);

    expect(geometryDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    expect(materialDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    expect(textureDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    expect(scene.children).toHaveLength(0);
  });
});
