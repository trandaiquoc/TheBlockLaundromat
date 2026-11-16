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
});
