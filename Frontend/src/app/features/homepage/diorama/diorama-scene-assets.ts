import * as THREE from 'three';
import type { DioramaFocus, DioramaTarget } from './diorama-contracts';
import { addFocusMarker } from './diorama-scene-geometry';
import type { DioramaSceneAsset } from './diorama-scene-loader';
import {
  LAUNDROMAT_DIORAMA_PROFILE,
  dioramaSceneNodeName,
  type DioramaSceneProfile,
} from './diorama-scene-profile';
import { applyDioramaTheme } from './diorama-scene-theme';

export interface DioramaSceneAssets {
  readonly scene: THREE.Scene;
  readonly model: THREE.Group;
  readonly profile: DioramaSceneProfile;
  readonly roomSpinPivot: THREE.Group;
  readonly outdoorGround: OutdoorGroundMaterials;
  readonly bounds: THREE.Box3;
  readonly focusBounds: Readonly<Record<DioramaFocus, THREE.Box3>>;
  readonly cameraFocusTargets: Readonly<Partial<Record<DioramaFocus, THREE.Vector3>>>;
  readonly cameraFocusYaws: Readonly<Partial<Record<DioramaFocus, number>>>;
  readonly materialVariants: DioramaSceneAsset['materialVariants'];
  readonly themeTargets: {
    readonly hemisphere: THREE.HemisphereLight;
    readonly keyLight: THREE.DirectionalLight;
    readonly fillLight: THREE.DirectionalLight;
    readonly lanternLights: readonly THREE.PointLight[];
    readonly outdoorGround?: OutdoorGroundMaterials;
  };
  readonly interactionRoots: readonly {
    readonly object: THREE.Object3D;
    readonly target: DioramaTarget;
  }[];
  readonly raccoonControllerRoot?: THREE.Object3D;
  readonly focusMarkers: Readonly<Record<DioramaTarget, THREE.Mesh>>;
}

export function buildDioramaScene(asset: DioramaSceneAsset): DioramaSceneAssets {
  const profile = LAUNDROMAT_DIORAMA_PROFILE;
  const contract = profile.nodeNames;
  const scene = new THREE.Scene();
  scene.name = `${profile.id}-scene`;
  scene.background = null;
  scene.add(asset.root);
  for (const { nodeName, offset } of profile.placements) {
    requireSceneObject(asset.root, nodeName).position.add(new THREE.Vector3(...offset));
  }
  scene.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(asset.root);
  if (bounds.isEmpty()) throw new Error('The scene GLB has empty scene bounds.');
  const roomSpinPivot = createRoomSpinPivot(scene, asset.root, bounds, profile);
  const outdoorGround = addOutdoorGround(scene, bounds, asset.exteriorGroundTexture, profile);

  const targets = {
    washer: requireSceneObject(asset.root, contract.interactionNodes.washer),
    'project-board': requireSceneObject(asset.root, contract.interactionNodes['project-board']),
    raccoon: requireSceneObject(asset.root, contract.raccoonRoots[0]),
  } satisfies Record<DioramaTarget, THREE.Object3D>;
  const raccoonRoots = contract.raccoonRoots.map((name) => requireSceneObject(asset.root, name));
  const focusBounds = {
    overview: bounds.clone(),
    washer: boundsFor(targets.washer),
    'project-board': contract.boardBoundsAnchors.length
      ? boundsFromAnchors(asset.root, contract.boardBoundsAnchors)
      : boundsFor(targets['project-board']),
    raccoon: boundsForObjects(raccoonRoots),
  } satisfies Record<DioramaFocus, THREE.Box3>;
  const focusMarkers = createFocusMarkers(scene, bounds, focusBounds, profile);
  scene.updateMatrixWorld(true);
  for (const marker of Object.values(focusMarkers)) roomSpinPivot.attach(marker);
  const cameraFocusTargets: Partial<Record<DioramaFocus, THREE.Vector3>> = {};
  for (const [focus, name] of Object.entries(contract.cameraFocusAnchors)) {
    cameraFocusTargets[focus as DioramaFocus] = worldPosition(requireSceneObject(asset.root, name));
  }
  const overviewTarget = cameraFocusTargets.overview;
  if (overviewTarget) {
    const center = bounds.getCenter(new THREE.Vector3());
    overviewTarget.x = center.x;
    overviewTarget.z = center.z;
  }
  cameraFocusTargets.washer = focusBounds.washer.getCenter(new THREE.Vector3());
  cameraFocusTargets.raccoon = focusBounds.raccoon.getCenter(new THREE.Vector3());
  const cameraFocusYaws: Partial<Record<DioramaFocus, number>> = {};
  for (const [view, target] of [
    ['washer', targets.washer],
    ['project-board', targets['project-board']],
  ] as const) {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      target.getWorldQuaternion(new THREE.Quaternion()),
    );
    cameraFocusYaws[view] = Math.atan2(forward.x, forward.z);
  }
  const lanterns = contract.lanternLightNodes.map((name) => ({
    nodeName: name,
    anchor: requireSceneObject(asset.root, name),
  }));
  const themeTargets = createThemeLights(scene, bounds, lanterns, outdoorGround, profile);

  const assets: DioramaSceneAssets = {
    scene,
    model: asset.root,
    profile,
    roomSpinPivot,
    outdoorGround,
    bounds,
    focusBounds,
    cameraFocusTargets,
    cameraFocusYaws,
    materialVariants: asset.materialVariants,
    themeTargets,
    interactionRoots: [
      { object: targets.washer, target: 'washer' },
      { object: targets['project-board'], target: 'project-board' },
      ...raccoonRoots.map((object) => ({ object, target: 'raccoon' as const })),
    ],
    raccoonControllerRoot: contract.raccoonControllerRoot
      ? requireSceneObject(asset.root, contract.raccoonControllerRoot)
      : undefined,
    focusMarkers,
  };

  applyDioramaTheme(assets, 'craft');
  return assets;
}

export function updateDioramaFeedback(
  markers: Readonly<Record<DioramaTarget, THREE.Mesh>>,
  selected: DioramaTarget | undefined,
  hovered: DioramaTarget | undefined,
  profile = LAUNDROMAT_DIORAMA_PROFILE,
): void {
  for (const target of Object.keys(markers) as DioramaTarget[]) {
    const material = markers[target].material as THREE.MeshBasicMaterial;
    material.opacity =
      target === selected
        ? profile.focusMarker.selectedOpacity
        : target === hovered
          ? profile.focusMarker.hoveredOpacity
          : 0.015;
    markers[target].scale.setScalar(
      target === selected
        ? profile.focusMarker.selectedScale
        : target === hovered
          ? profile.focusMarker.hoveredScale
          : 1,
    );
  }
}

function requireSceneObject(root: THREE.Object3D, name: string): THREE.Object3D {
  const object = root.getObjectByName(dioramaSceneNodeName(name));
  if (!object) throw new Error(`The scene GLB is missing its '${name}' scene object.`);
  return object;
}

function boundsFor(object: THREE.Object3D): THREE.Box3 {
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) throw new Error(`The scene object '${object.name}' has empty bounds.`);
  return bounds;
}

function boundsForObjects(objects: readonly THREE.Object3D[]): THREE.Box3 {
  const bounds = new THREE.Box3();
  for (const object of objects) bounds.union(boundsFor(object));
  if (bounds.isEmpty()) throw new Error('The scene characters have empty bounds.');
  return bounds;
}

function boundsFromAnchors(root: THREE.Object3D, names: readonly string[]): THREE.Box3 {
  const bounds = new THREE.Box3().setFromPoints(
    names.map((name) => worldPosition(requireSceneObject(root, name))),
  );
  if (bounds.isEmpty()) throw new Error('The project board anchors have empty bounds.');
  return bounds.expandByScalar(0.23);
}

function worldPosition(object: THREE.Object3D): THREE.Vector3 {
  object.updateWorldMatrix(true, false);
  return object.getWorldPosition(new THREE.Vector3());
}

function createFocusMarkers(
  scene: THREE.Scene,
  sceneBounds: THREE.Box3,
  focusBounds: Readonly<Record<DioramaFocus, THREE.Box3>>,
  profile: DioramaSceneProfile,
): Readonly<Record<DioramaTarget, THREE.Mesh>> {
  return {
    washer: addFocusMarker(
      scene,
      profile.focusMarker.baseColor,
      markerPosition(sceneBounds, focusBounds.washer, profile),
      markerRadius(focusBounds.washer, profile),
    ),
    'project-board': addFocusMarker(
      scene,
      profile.focusMarker.baseColor,
      markerPosition(sceneBounds, focusBounds['project-board'], profile),
      markerRadius(focusBounds['project-board'], profile),
    ),
    raccoon: addFocusMarker(
      scene,
      profile.focusMarker.baseColor,
      markerPosition(sceneBounds, focusBounds.raccoon, profile),
      markerRadius(focusBounds.raccoon, profile),
    ),
  };
}

function markerPosition(
  sceneBounds: THREE.Box3,
  targetBounds: THREE.Box3,
  profile: DioramaSceneProfile,
): THREE.Vector3 {
  return new THREE.Vector3(
    (targetBounds.min.x + targetBounds.max.x) / 2,
    sceneBounds.min.y + profile.focusMarker.groundOffset,
    (targetBounds.min.z + targetBounds.max.z) / 2,
  );
}

function markerRadius(bounds: THREE.Box3, profile: DioramaSceneProfile): number {
  const size = bounds.getSize(new THREE.Vector3());
  return Math.max(
    profile.focusMarker.minimumRadius,
    Math.max(size.x, size.z) * profile.focusMarker.radiusScale,
  );
}

function createThemeLights(
  scene: THREE.Scene,
  bounds: THREE.Box3,
  lanterns: readonly { readonly nodeName: string; readonly anchor: THREE.Object3D }[],
  outdoorGround: OutdoorGroundMaterials | undefined,
  profile: DioramaSceneProfile,
): DioramaSceneAssets['themeTargets'] {
  const size = bounds.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z, 1);

  const hemisphere = new THREE.HemisphereLight(...profile.lighting.hemisphere);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(
    profile.lighting.key.color,
    profile.lighting.key.intensity,
  );
  keyLight.position.set(
    bounds.min.x + extent * profile.lighting.key.positionScale[0],
    bounds.max.y + extent * profile.lighting.key.positionScale[1],
    bounds.max.z + extent * profile.lighting.key.positionScale[2],
  );
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(profile.renderer.shadowMapSize, profile.renderer.shadowMapSize);
  keyLight.shadow.camera.left = -extent;
  keyLight.shadow.camera.right = extent;
  keyLight.shadow.camera.top = extent;
  keyLight.shadow.camera.bottom = -extent;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = extent * 5;
  keyLight.shadow.bias = profile.lighting.key.shadowBias;
  keyLight.shadow.normalBias = profile.lighting.key.shadowNormalBias;
  keyLight.shadow.camera.updateProjectionMatrix();
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(
    profile.lighting.fill.color,
    profile.lighting.fill.intensity,
  );
  fillLight.position.set(
    bounds.max.x + extent * profile.lighting.fill.positionScale[0],
    bounds.max.y * profile.lighting.fill.positionScale[1],
    bounds.min.z + extent * profile.lighting.fill.positionScale[2],
  );
  scene.add(fillLight);

  const lanternLights = lanterns.map(({ nodeName, anchor }) => {
    const lanternLight = new THREE.PointLight(
      profile.lighting.lantern.color,
      profile.lighting.lantern.intensity,
      extent * profile.lighting.lantern.distanceScale,
      profile.lighting.lantern.decay,
    );
    lanternLight.name = `${nodeName}.PreviewLight`;
    lanternLight.position.set(0, 0, 0);
    anchor.add(lanternLight);
    return lanternLight;
  });

  return {
    hemisphere,
    keyLight,
    fillLight,
    lanternLights,
    outdoorGround,
  };
}

interface OutdoorGroundMaterials {
  readonly surface: THREE.ShaderMaterial;
}

function createRoomSpinPivot(
  scene: THREE.Scene,
  model: THREE.Group,
  bounds: THREE.Box3,
  profile: DioramaSceneProfile,
): THREE.Group {
  const center = bounds.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  pivot.name = profile.nodeNames.roomSpinPivot;
  pivot.position.set(center.x, 0, center.z);
  scene.add(pivot);
  pivot.attach(model);
  scene.updateMatrixWorld(true);
  return pivot;
}

function addOutdoorGround(
  scene: THREE.Scene,
  bounds: THREE.Box3,
  texture: THREE.Texture,
  sceneProfile: DioramaSceneProfile,
): OutdoorGroundMaterials {
  const profile = sceneProfile.ground;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.z, 1);
  const planeSize = extent * profile.planeExtentScale;
  const surfaceMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uCenter: { value: new THREE.Vector2(center.x, center.z) },
      uInnerBounds: {
        value: new THREE.Vector2(
          extent * profile.innerBoundsScale,
          extent * profile.innerBoundsScale,
        ),
      },
      uFadeDistance: { value: extent * profile.fadeDistanceScale },
      uGroundTexture: { value: texture },
      uTextureRepeat: { value: profile.textureRepeat },
      uTint: { value: new THREE.Color(profile.tint) },
      uOpacity: { value: profile.opacity },
      uContactStrength: { value: profile.contactStrength },
    },
    vertexShader: `
      varying vec2 vGroundPosition;
      varying vec2 vUv;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vGroundPosition = worldPosition.xz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec2 uCenter;
      uniform vec2 uInnerBounds;
      uniform float uFadeDistance;
      uniform sampler2D uGroundTexture;
      uniform float uTextureRepeat;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform float uContactStrength;
      varying vec2 vGroundPosition;
      varying vec2 vUv;
      void main() {
        vec2 outside = max(abs(vGroundPosition - uCenter) - uInnerBounds, vec2(0.0));
        float distanceFromRoom = length(outside);
        float fade = 1.0 - smoothstep(0.0, uFadeDistance, distanceFromRoom);
        float footprintDistance = length((vGroundPosition - uCenter) / uInnerBounds);
        float contactShadow = 1.0 - smoothstep(0.82, 1.55, footprintDistance);
        float contactShade = 1.0 - contactShadow * uContactStrength;
        vec3 paving = texture2D(uGroundTexture, vUv * uTextureRepeat).rgb * uTint;
        float alpha = fade * uOpacity;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(paving * contactShade, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), surfaceMaterial);
  surface.name = 'Preview.OutdoorGround';
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(center.x, bounds.min.y + profile.surfaceHeightOffset, center.z);
  surface.renderOrder = 1;
  scene.add(surface);

  const roomShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(planeSize, planeSize),
    new THREE.ShadowMaterial({ color: profile.shadowColor, opacity: profile.shadowOpacity }),
  );
  roomShadow.name = 'Preview.RoomContactShadow';
  roomShadow.rotation.x = -Math.PI / 2;
  roomShadow.position.set(center.x, surface.position.y + profile.shadowHeightOffset, center.z);
  roomShadow.receiveShadow = true;
  roomShadow.renderOrder = 2;
  scene.add(roomShadow);
  return { surface: surfaceMaterial };
}
