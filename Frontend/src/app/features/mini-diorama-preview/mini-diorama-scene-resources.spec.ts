import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { disposeMiniDioramaScene } from './mini-diorama-scene-resources';

describe('mini diorama scene resources', () => {
  it('disposes shared materials and geometry once, then clears the scene', () => {
    const { scene } = buildMiniDioramaScene();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
      }
    });
    const geometryDisposals = [...geometries].map((geometry) => vi.spyOn(geometry, 'dispose'));
    const materialDisposals = [...materials].map((material) => vi.spyOn(material, 'dispose'));

    disposeMiniDioramaScene(scene);
    disposeMiniDioramaScene(scene);

    expect(geometryDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    expect(materialDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    expect(scene.children).toHaveLength(0);
  });
});
