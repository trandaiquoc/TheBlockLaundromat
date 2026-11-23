import * as THREE from 'three';

export const dioramaShadowProxyLayer = 1;

interface ShadowCasterSource {
  readonly positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  readonly indices: THREE.BufferAttribute | null;
  readonly matrix: THREE.Matrix4;
  readonly reverseWinding: boolean;
  readonly drawRanges: readonly GeometryRange[];
}

interface GeometryRange {
  readonly start: number;
  readonly count: number;
}

interface ShadowCasterBatch {
  readonly side: THREE.Material['side'];
  readonly sources: ShadowCasterSource[];
  vertexCount: number;
  indexCount: number;
}

export function createDioramaStaticShadowCasters(
  model: THREE.Object3D,
  roomSpinPivot: THREE.Group,
  dynamicCasterRoots: readonly THREE.Object3D[],
  profileId: string,
): readonly THREE.Mesh[] {
  roomSpinPivot.updateWorldMatrix(true, true);
  const pivotFromWorld = roomSpinPivot.matrixWorld.clone().invert();
  const dynamicRoots = new Set(dynamicCasterRoots);
  const batches = new Map<THREE.Material['side'], ShadowCasterBatch>();
  const staticMeshes: THREE.Mesh[] = [];

  model.traverse((object) => {
    if (!isMesh(object) || !object.castShadow || !isVisibleWithin(object, model)) return;
    if (isWithinAnyRoot(object, dynamicRoots) || hasDynamicGeometry(object)) return;

    const source = createShadowCasterSource(object, pivotFromWorld);
    if (!source) return;
    const material = shadowCasterMaterial(object);
    const side = material.shadowSide ?? material.side;
    let batch = batches.get(side);
    if (!batch) {
      batch = { side, sources: [], vertexCount: 0, indexCount: 0 };
      batches.set(side, batch);
    }
    batch.sources.push(source);
    batch.vertexCount += source.positions.count;
    batch.indexCount += totalDrawCount(source.drawRanges);
    staticMeshes.push(object);
  });

  const proxies = [...batches.values()].map((batch) =>
    createShadowCasterProxy(batch, roomSpinPivot, profileId),
  );
  for (const mesh of staticMeshes) mesh.castShadow = false;
  return proxies;
}

function createShadowCasterSource(
  mesh: THREE.Mesh,
  pivotFromWorld: THREE.Matrix4,
): ShadowCasterSource | undefined {
  const positions = mesh.geometry.getAttribute('position');
  if (!positions || positions.count === 0) return undefined;

  const indices = mesh.geometry.index;
  const indexCount = indices?.count ?? positions.count;
  const drawRanges = geometryDrawRanges(mesh, indexCount);
  if (drawRanges.length === 0) return undefined;

  const matrix = pivotFromWorld.clone().multiply(mesh.matrixWorld);
  const determinant = matrix.determinant();
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    throw new Error(`Diorama shadow proxy cannot merge singular geometry on '${mesh.name}'.`);
  }

  return {
    positions,
    indices,
    matrix,
    reverseWinding: determinant < 0,
    drawRanges,
  };
}

function geometryDrawRanges(mesh: THREE.Mesh, indexCount: number): readonly GeometryRange[] {
  const { start, count } = mesh.geometry.drawRange;
  const end = Math.min(start + count, indexCount);
  if (
    !Number.isInteger(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    end > indexCount
  ) {
    throw new Error(`Diorama shadow proxy cannot merge an invalid draw range on '${mesh.name}'.`);
  }

  const sourceRanges =
    mesh.geometry.groups.length > 0 ? mesh.geometry.groups : [{ start, count: end - start }];
  const ranges = sourceRanges
    .map((range) => {
      if (
        !Number.isInteger(range.start) ||
        !Number.isInteger(range.count) ||
        range.start < 0 ||
        range.count < 0 ||
        range.start + range.count > indexCount
      ) {
        throw new Error(`Diorama shadow proxy cannot merge an invalid group on '${mesh.name}'.`);
      }
      const rangeStart = Math.max(start, range.start);
      const rangeEnd = Math.min(end, range.start + range.count);
      return { start: rangeStart, count: rangeEnd - rangeStart };
    })
    .filter((range) => range.count > 0)
    .sort((left, right) => left.start - right.start);

  const merged: GeometryRange[] = [];
  for (const range of ranges) {
    if (range.start % 3 !== 0 || range.count % 3 !== 0) {
      throw new Error(`Diorama shadow proxy cannot merge non-triangle geometry on '${mesh.name}'.`);
    }
    const previous = merged.at(-1);
    if (previous && range.start <= previous.start + previous.count) {
      merged[merged.length - 1] = {
        start: previous.start,
        count:
          Math.max(previous.start + previous.count, range.start + range.count) - previous.start,
      };
    } else {
      merged.push(range);
    }
  }
  return merged;
}

function totalDrawCount(ranges: readonly GeometryRange[]): number {
  return ranges.reduce((total, range) => total + range.count, 0);
}

function createShadowCasterProxy(
  batch: ShadowCasterBatch,
  roomSpinPivot: THREE.Group,
  profileId: string,
): THREE.Mesh {
  const positions = new Float32Array(batch.vertexCount * 3);
  const indices = new Uint32Array(batch.indexCount);
  let vertexOffset = 0;
  let indexOffset = 0;
  const vertex = new THREE.Vector3();

  for (const source of batch.sources) {
    for (let index = 0; index < source.positions.count; index++) {
      vertex.fromBufferAttribute(source.positions, index).applyMatrix4(source.matrix);
      const targetIndex = (vertexOffset + index) * 3;
      positions[targetIndex] = vertex.x;
      positions[targetIndex + 1] = vertex.y;
      positions[targetIndex + 2] = vertex.z;
    }

    for (const range of source.drawRanges) {
      for (let index = range.start; index < range.start + range.count; index += 3) {
        const first = source.indices?.getX(index) ?? index;
        const second = source.indices?.getX(index + 1) ?? index + 1;
        const third = source.indices?.getX(index + 2) ?? index + 2;
        indices[indexOffset] = vertexOffset + first;
        indices[indexOffset + 1] = vertexOffset + (source.reverseWinding ? third : second);
        indices[indexOffset + 2] = vertexOffset + (source.reverseWinding ? second : third);
        indexOffset += 3;
      }
    }

    vertexOffset += source.positions.count;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const proxy = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: batch.side }));
  proxy.name = `${profileId}-static-shadow-casters`;
  proxy.castShadow = true;
  proxy.receiveShadow = false;
  proxy.layers.set(dioramaShadowProxyLayer);
  roomSpinPivot.add(proxy);
  return proxy;
}

function shadowCasterMaterial(mesh: THREE.Mesh): THREE.Material {
  if (Array.isArray(mesh.material)) {
    throw new Error(`Diorama shadow proxy requires one material on '${mesh.name}'.`);
  }
  return mesh.material;
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
  return 'isMesh' in object && object.isMesh === true;
}

function hasDynamicGeometry(mesh: THREE.Mesh): boolean {
  const skinned = mesh as THREE.SkinnedMesh;
  const instanced = mesh as THREE.InstancedMesh;
  return (
    skinned.isSkinnedMesh === true ||
    instanced.isInstancedMesh === true ||
    Boolean(mesh.morphTargetInfluences?.length)
  );
}

function isWithinAnyRoot(object: THREE.Object3D, roots: ReadonlySet<THREE.Object3D>): boolean {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (roots.has(current)) return true;
  }
  return false;
}

function isVisibleWithin(object: THREE.Object3D, root: THREE.Object3D): boolean {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (!current.visible) return false;
    if (current === root) return true;
  }
  return false;
}
