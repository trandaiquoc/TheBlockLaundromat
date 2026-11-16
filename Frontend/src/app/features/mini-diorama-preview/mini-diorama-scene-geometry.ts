import * as THREE from 'three';

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

export function addCuboid(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  position: readonly [number, number, number],
  rotation: readonly [number, number, number] = [0, 0, 0],
  castShadow = false,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
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
