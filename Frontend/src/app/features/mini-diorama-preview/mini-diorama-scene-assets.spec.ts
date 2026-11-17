import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { applyMiniDioramaTheme } from './mini-diorama-scene-materials';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';

describe('mini diorama scene assets', () => {
  it('changes materials, lighting, and window cues in the same scene for each theme', () => {
    const assets = buildMiniDioramaScene();
    const scene = assets.scene;
    const originalWall = assets.materials.wall.color.getHex();
    const originalFloor = assets.materials.floorboard.color.getHex();
    const originalBackground = (scene.background as THREE.Color).getHex();
    const originalKeyIntensity = assets.themeTargets.keyLight.intensity;

    applyMiniDioramaTheme(scene, assets.materials, 'dark', assets.themeTargets);

    expect(assets.scene).toBe(scene);
    expect(assets.materials.wall.color.getHex()).not.toBe(originalWall);
    expect(assets.materials.floorboard.color.getHex()).not.toBe(originalFloor);
    expect(scene.background).toBeInstanceOf(THREE.Color);
    expect((scene.background as THREE.Color).getHex()).not.toBe(originalBackground);
    expect((scene.fog as THREE.Fog).color.getHex()).toBe(
      (scene.background as THREE.Color).getHex(),
    );
    expect(assets.themeTargets.keyLight.intensity).not.toBe(originalKeyIntensity);
    expect(assets.themeTargets.window.nightDetails.visible).toBe(true);
    expect(assets.themeTargets.window.dayDetails.visible).toBe(false);
    expect(assets.themeTargets.window.stars.visible).toBe(true);
    expect(assets.themeTargets.window.nightAccent.color.getHex()).toBe(0x62c5d2);

    applyMiniDioramaTheme(scene, assets.materials, 'raccoon', assets.themeTargets);
    expect(assets.themeTargets.window.duskDetails.visible).toBe(true);
    expect(assets.themeTargets.window.nightDetails.visible).toBe(false);

    applyMiniDioramaTheme(scene, assets.materials, 'light', assets.themeTargets);
    expect(assets.themeTargets.window.dayDetails.visible).toBe(true);
    expect(assets.themeTargets.window.duskDetails.visible).toBe(false);
    expect(assets.themeTargets.pendantLights.every(({ intensity }) => intensity > 0)).toBe(true);
    expect(assets.materials.floorboard.color.getHex()).toBe(0xaf885d);
    disposeMiniDioramaResources(scene);
  });

  it('keeps a stable scene anchor for the authored raccoon and its picking target', () => {
    const assets = buildMiniDioramaScene();
    const raccoonRoot = assets.interactionRoots.find(({ target }) => target === 'raccoon')?.object;
    if (!raccoonRoot) throw new Error('Raccoon interaction root was not built.');

    expect(raccoonRoot).toBe(assets.raccoonAnchor);
    expect(raccoonRoot.name).toBe('laundromat-raccoon');
    expect(assets.raccoonAnchor.position.toArray()).toEqual([-1.28, 0, 0.72]);
    expect(assets.raccoonAnchor.scale.toArray()).toEqual([2, 2, 2]);
    expect(assets.raccoonAnchor.rotation.y).toBe(0);
    expect(assets.raccoonAnchor.children).toHaveLength(0);

    const shadow = assets.scene.getObjectByName('raccoon-ground-shadow');
    expect(shadow).toBeInstanceOf(THREE.Mesh);
    expect((shadow as THREE.Mesh).geometry).toBeInstanceOf(THREE.BoxGeometry);
    disposeMiniDioramaResources(assets.scene);
  });
});
