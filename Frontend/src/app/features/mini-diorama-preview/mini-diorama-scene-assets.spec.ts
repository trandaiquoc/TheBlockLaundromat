import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { raccoonTextureRegionUv } from './mini-diorama-raccoon-texture';
import { applyMiniDioramaTheme } from './mini-diorama-scene-materials';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { disposeMiniDioramaScene } from './mini-diorama-scene-resources';

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
    disposeMiniDioramaScene(scene);
  });

  it('builds a custom raccoon from cuboids and an original pixel atlas', () => {
    const assets = buildMiniDioramaScene();
    const raccoonRoot = assets.interactionRoots.find(({ target }) => target === 'raccoon')?.object;
    if (!raccoonRoot) throw new Error('Raccoon interaction root was not built.');

    const getMesh = (name: string): THREE.Mesh => {
      const object = raccoonRoot.getObjectByName(name);
      if (!(object instanceof THREE.Mesh)) throw new Error(`Raccoon mesh '${name}' was not built.`);
      return object;
    };
    const head = getMesh('raccoon-head-cuboid');
    const body = getMesh('raccoon-torso');
    const tail = getMesh('raccoon-banded-tail');
    const forearm = getMesh('raccoon-front-leg-left-cuboid');
    const raccoonMeshes: THREE.Mesh[] = [];
    raccoonRoot.traverse((object) => {
      if (object instanceof THREE.Mesh) raccoonMeshes.push(object);
    });

    expect((head.geometry as THREE.BoxGeometry).parameters.width).toBeCloseTo(0.75);
    expect((head.geometry as THREE.BoxGeometry).parameters.height).toBeCloseTo(0.58);
    expect((head.geometry as THREE.BoxGeometry).parameters.depth).toBeCloseTo(0.42);
    expect((body.geometry as THREE.BoxGeometry).parameters.width).toBeCloseTo(0.92);
    expect((body.geometry as THREE.BoxGeometry).parameters.height).toBeCloseTo(1.25);
    expect((body.geometry as THREE.BoxGeometry).parameters.depth).toBeCloseTo(0.68);
    expect((tail.geometry as THREE.BoxGeometry).parameters.depth).toBeCloseTo(1.58);
    expect((forearm.geometry as THREE.BoxGeometry).parameters.height).toBeCloseTo(0.58);
    expect((head.geometry as THREE.BoxGeometry).parameters.width).toBeLessThan(
      (body.geometry as THREE.BoxGeometry).parameters.width,
    );
    expect(assets.raccoon.body.position.y).toBeCloseTo(0.82);
    expect(assets.raccoon.body.rotation.x).toBe(0);
    expect(assets.raccoon.head.rotation.x).toBe(0);
    expect(assets.raccoon.tail.rotation.x).toBeCloseTo(0.3);
    expect(assets.raccoon.greetingArm.name).toBe('raccoon-front-leg-right');
    for (const eye of assets.raccoon.eyeLids) expect(eye.position.z).toBeCloseTo(-0.205);
    expect(head.geometry.getAttribute('position').count).toBe(24);
    expect(head.geometry.groups).toHaveLength(0);
    expect(tail.geometry.groups).toHaveLength(0);
    expect(tail.material).toBe(assets.materials.raccoonSkin);
    expect(assets.raccoon.eyeLids).toHaveLength(2);
    expect(assets.raccoon.eyeLids.every((eye) => eye.children.length === 1)).toBe(true);
    expect(assets.raccoon.legs).toHaveLength(4);
    expect(assets.materials.raccoonSkin.map).toBeInstanceOf(THREE.DataTexture);
    expect((assets.materials.raccoonSkin.map as THREE.DataTexture).image.width).toBe(64);
    expect((assets.materials.raccoonSkin.map as THREE.DataTexture).magFilter).toBe(
      THREE.NearestFilter,
    );
    expect(raccoonMeshes.every(({ geometry }) => geometry.type === 'BoxGeometry')).toBe(true);
    expect(raccoonMeshes.some(({ geometry }) => geometry.type === 'SphereGeometry')).toBe(false);
    expect(
      raccoonMeshes
        .filter(({ name }) => name !== 'raccoon-ground-shadow')
        .every(({ material }) => material === assets.materials.raccoonSkin),
    ).toBe(true);
    const raccoonUv = head.geometry.getAttribute('uv');
    for (let index = 0; index < raccoonUv.count; index++) {
      expect(raccoonUv.getX(index)).toBeGreaterThanOrEqual(0);
      expect(raccoonUv.getX(index)).toBeLessThanOrEqual(1);
      expect(raccoonUv.getY(index)).toBeGreaterThanOrEqual(0);
      expect(raccoonUv.getY(index)).toBeLessThanOrEqual(1);
    }
    const [sideUMin, sideVMin, sideUMax, sideVMax] = raccoonTextureRegionUv('faceSide');
    for (let index = 0; index < 4; index++) {
      expect(raccoonUv.getX(index)).toBeGreaterThanOrEqual(sideUMin);
      expect(raccoonUv.getX(index)).toBeLessThanOrEqual(sideUMax);
      expect(raccoonUv.getY(index)).toBeGreaterThanOrEqual(sideVMin);
      expect(raccoonUv.getY(index)).toBeLessThanOrEqual(sideVMax);
    }
    disposeMiniDioramaScene(assets.scene);
  });
});
