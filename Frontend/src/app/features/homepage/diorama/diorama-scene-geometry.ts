import * as THREE from 'three';

export function addFocusMarker(
  scene: THREE.Scene,
  color: number,
  position: THREE.Vector3,
  radius: number,
): THREE.Mesh {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.026, 8, 48), markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.copy(position);
  marker.renderOrder = 1;
  scene.add(marker);
  return marker;
}
