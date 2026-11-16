import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyMiniDioramaTheme } from './mini-diorama-scene-materials';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { disposeMiniDioramaScene } from './mini-diorama-scene-resources';

describe('mini diorama scene assets', () => {
  it('applies each application theme to the same procedural scene materials', () => {
    const assets = buildMiniDioramaScene();
    const originalWall = assets.materials.wall.color.getHex();
    const originalBackground = (assets.scene.background as THREE.Color).getHex();

    applyMiniDioramaTheme(assets.scene, assets.materials, 'dark');

    expect(assets.materials.wall.color.getHex()).not.toBe(originalWall);
    expect(assets.scene.background).toBeInstanceOf(THREE.Color);
    expect((assets.scene.background as THREE.Color).getHex()).not.toBe(originalBackground);
    expect((assets.scene.fog as THREE.Fog).color.getHex()).toBe(
      (assets.scene.background as THREE.Color).getHex(),
    );
    disposeMiniDioramaScene(assets.scene);
  });

  it('builds the Raccoon from a compact head and body with a continuous soft tail', () => {
    const assets = buildMiniDioramaScene();
    const raccoonRoot = assets.interactionRoots.find(({ target }) => target === 'raccoon')?.object;
    if (!raccoonRoot) throw new Error('Raccoon interaction root was not built.');

    const getMesh = (name: string): THREE.Mesh => {
      const object = raccoonRoot.getObjectByName(name);
      if (!(object instanceof THREE.Mesh)) throw new Error(`Raccoon mesh '${name}' was not built.`);
      return object;
    };
    const head = getMesh('raccoon-head-shell');
    const body = getMesh('raccoon-body-shell');
    const tail = getMesh('raccoon-soft-striped-tail');
    const raccoonMeshes: THREE.Mesh[] = [];
    raccoonRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) raccoonMeshes.push(object);
    });

    const headBounds = new THREE.Box3().setFromObject(head).getSize(new THREE.Vector3());
    const bodyBounds = new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3());
    expect(headBounds.x).toBeGreaterThan(bodyBounds.x);
    expect(tail.geometry.getAttribute('color').count).toBeGreaterThan(500);
    expect(tail.material).toMatchObject({ vertexColors: true });
    expect(raccoonMeshes.some(({ geometry }) => geometry.type === 'TorusGeometry')).toBe(false);
    expect(assets.raccoon.eyeLids.every((eye) => eye.children.length === 2)).toBe(true);
    expect(assets.materials.raccoonEye.roughness).toBeGreaterThanOrEqual(0.9);

    disposeMiniDioramaScene(assets.scene);
  });
});
