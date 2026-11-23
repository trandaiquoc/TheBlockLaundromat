import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createDioramaStaticShadowCasters, dioramaShadowProxyLayer } from './diorama-scene-shadow';

describe('Diorama static shadow casters', () => {
  it('merges static meshes in pivot space and keeps dynamic and skinned casters separate', () => {
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    pivot.position.set(4, 1, -2);
    pivot.rotation.y = 0.35;
    scene.add(pivot);

    const model = new THREE.Group();
    model.position.set(0.5, 0, 1);
    pivot.add(model);

    const staticMesh = createTriangleMesh('Static wall');
    staticMesh.position.set(1, 0.4, 0.7);
    staticMesh.castShadow = true;
    model.add(staticMesh);

    const nonCasterMesh = createTriangleMesh('Non-caster detail');
    nonCasterMesh.castShadow = false;
    model.add(nonCasterMesh);

    const movingRoot = new THREE.Group();
    const movingMesh = createTriangleMesh('Moving character');
    movingMesh.castShadow = true;
    movingRoot.add(movingMesh);
    model.add(movingRoot);

    const skinnedMesh = new THREE.SkinnedMesh(
      new THREE.BoxGeometry(0.25, 0.25, 0.25),
      new THREE.MeshBasicMaterial(),
    );
    skinnedMesh.name = 'Skinned tail';
    skinnedMesh.castShadow = true;
    model.add(skinnedMesh);

    scene.updateMatrixWorld(true);
    const expectedStaticBounds = new THREE.Box3().setFromObject(staticMesh);
    const proxies = createDioramaStaticShadowCasters(model, pivot, [movingRoot], 'laundromat');
    scene.updateMatrixWorld(true);

    expect(proxies).toHaveLength(1);
    expect(proxies[0].name).toBe('laundromat-static-shadow-casters');
    expect(proxies[0].layers.isEnabled(dioramaShadowProxyLayer)).toBe(true);
    expect(proxies[0].material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect((proxies[0].material as THREE.MeshBasicMaterial).side).toBe(THREE.FrontSide);
    const proxyBounds = new THREE.Box3().setFromObject(proxies[0]);
    for (const axis of [0, 1, 2] as const) {
      expect(proxyBounds.min.getComponent(axis)).toBeCloseTo(
        expectedStaticBounds.min.getComponent(axis),
        5,
      );
      expect(proxyBounds.max.getComponent(axis)).toBeCloseTo(
        expectedStaticBounds.max.getComponent(axis),
        5,
      );
    }
    expect(staticMesh.castShadow).toBe(false);
    expect(nonCasterMesh.castShadow).toBe(false);
    expect(movingMesh.castShadow).toBe(true);
    expect(skinnedMesh.castShadow).toBe(true);
  });

  it('keeps different shadow sides separate and corrects mirrored triangle winding', () => {
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    const model = new THREE.Group();
    scene.add(pivot);
    pivot.add(model);

    const frontSideMesh = createTriangleMesh('Front-side triangle');
    frontSideMesh.scale.x = -1;
    frontSideMesh.castShadow = true;
    model.add(frontSideMesh);

    const doubleSideMesh = createTriangleMesh('Double-side triangle');
    doubleSideMesh.material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    doubleSideMesh.castShadow = true;
    model.add(doubleSideMesh);
    scene.updateMatrixWorld(true);

    const proxies = createDioramaStaticShadowCasters(model, pivot, [], 'test-scene');
    const frontSideProxy = proxies.find(
      (proxy) => (proxy.material as THREE.MeshBasicMaterial).side === THREE.FrontSide,
    );
    const doubleSideProxy = proxies.find(
      (proxy) => (proxy.material as THREE.MeshBasicMaterial).side === THREE.DoubleSide,
    );

    expect(proxies).toHaveLength(2);
    expect(Array.from(frontSideProxy!.geometry.index!.array)).toEqual([0, 2, 1]);
    expect(doubleSideProxy).toBeTruthy();
  });

  it('keeps only grouped triangle ranges when building shadow casters', () => {
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    const model = new THREE.Group();
    const groupedMesh = createTriangleMesh('Grouped triangle');
    groupedMesh.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0], 3),
    );
    groupedMesh.geometry.setIndex([0, 1, 2, 3, 4, 5]);
    groupedMesh.geometry.addGroup(0, 3, 0);
    groupedMesh.castShadow = true;
    scene.add(pivot);
    pivot.add(model);
    model.add(groupedMesh);
    scene.updateMatrixWorld(true);

    const proxies = createDioramaStaticShadowCasters(model, pivot, [], 'test-scene');

    expect(proxies).toHaveLength(1);
    expect(Array.from(proxies[0].geometry.index!.array)).toEqual([0, 1, 2]);
  });
});

function createTriangleMesh(name: string): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3),
  );
  geometry.setIndex([0, 1, 2]);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.name = name;
  return mesh;
}
