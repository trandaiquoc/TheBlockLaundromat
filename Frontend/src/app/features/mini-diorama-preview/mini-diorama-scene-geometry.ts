import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';

export function addFocusMarker(
  scene: THREE.Scene,
  color: THREE.Material,
  position: readonly [number, number, number],
): THREE.Mesh {
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: (color as THREE.MeshStandardMaterial).color,
    emissive: (color as THREE.MeshStandardMaterial).color,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    roughness: 0.36,
  });
  const marker = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.026, 8, 48), markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(...position);
  marker.renderOrder = 1;
  scene.add(marker);
  return marker;
}

export function addCurve(
  parent: THREE.Object3D,
  points: readonly (readonly [number, number, number])[],
  material: THREE.Material,
  radius: number,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(12, points.length * 8), radius, 8, false),
    material,
  );
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}

export function addRoundedBox(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  radius: number,
): THREE.Mesh {
  const safeRadius = Math.min(radius, width * 0.45, height * 0.45, depth * 0.45);
  const geometry = new RoundedBoxGeometry(width, height, depth, 3, safeRadius);
  return addMesh(parent, geometry, material, position);
}

export function addCylinder(
  parent: THREE.Object3D,
  topRadius: number,
  bottomRadius: number,
  height: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  return addMesh(
    parent,
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24),
    material,
    position,
    rotation,
  );
}

export function addCapsule(
  parent: THREE.Object3D,
  radius: number,
  length: number,
  material: THREE.Material,
  position: readonly [number, number, number],
): THREE.Mesh {
  return addMesh(parent, new THREE.CapsuleGeometry(radius, length, 5, 12), material, position);
}

export function addSphere(
  parent: THREE.Object3D,
  radius: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  scale: readonly [number, number, number] = [1, 1, 1],
): THREE.Mesh {
  const mesh = addMesh(parent, new THREE.SphereGeometry(radius, 28, 20), material, position);
  mesh.scale.set(...scale);
  return mesh;
}

export function addTorus(
  parent: THREE.Object3D,
  radius: number,
  tube: number,
  material: THREE.Material,
  position: readonly [number, number, number],
): THREE.Mesh {
  return addMesh(parent, new THREE.TorusGeometry(radius, tube, 16, 64), material, position);
}

export function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
  castShadow = false,
  receiveShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

export function addGroup(
  parent: THREE.Object3D,
  position: readonly [number, number, number],
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  return group;
}
