import * as THREE from 'three';
import type { Theme } from '../../core/ui/theme/theme.service';
import type { MiniDioramaMaterialVariantName } from './mini-diorama-material-variants';
import type { MiniDioramaSceneAssets } from './mini-diorama-scene-assets';

interface SceneThemeProfile {
  readonly variant: MiniDioramaMaterialVariantName;
  readonly hemisphere: readonly [sky: number, ground: number, intensity: number];
  readonly key: readonly [color: number, intensity: number];
  readonly fill: readonly [color: number, intensity: number];
  readonly lantern: readonly [color: number, intensity: number];
  readonly marker: number;
  readonly groundTint: number;
  readonly groundOpacity: number;
}

export type MiniDioramaThemeTransition = (progress: number) => void;

interface ThemeLightTransition {
  readonly color: MiniDioramaThemeTransition;
  readonly intensity: (progress: number) => void;
}

const themeProfiles: Readonly<Record<Theme, SceneThemeProfile>> = {
  craft: {
    variant: 'Minecraft',
    hemisphere: [0xfff0d5, 0x604833, 1.6],
    key: [0xffdda7, 2.1],
    fill: [0xc6d9e9, 0.62],
    lantern: [0xffc486, 3.4],
    marker: 0xe4b56c,
    groundTint: 0xfff1dc,
    groundOpacity: 0.82,
  },
  light: {
    variant: 'Light',
    hemisphere: [0xfff8e8, 0x7f887a, 1.9],
    key: [0xfff0d5, 2.6],
    fill: [0xd8e8f0, 0.95],
    lantern: [0xffe7c0, 1.8],
    marker: 0x8e9d7a,
    groundTint: 0xffffff,
    groundOpacity: 0.76,
  },
  raccoon: {
    variant: 'Raccoon',
    hemisphere: [0xd7c4ea, 0x3f3448, 0.95],
    key: [0xffb375, 1.45],
    fill: [0x9e9acc, 0.72],
    lantern: [0xff9448, 5.4],
    marker: 0xd99f70,
    groundTint: 0xffd7d0,
    groundOpacity: 0.74,
  },
  dark: {
    variant: 'Dark',
    hemisphere: [0x8da5cd, 0x232a45, 0.5],
    key: [0x88aee4, 1.0],
    fill: [0x7ba3d6, 0.55],
    lantern: [0xffbf65, 7.2],
    marker: 0x69c5d0,
    groundTint: 0xc6d6ef,
    groundOpacity: 0.72,
  },
};

export function miniDioramaVariantForTheme(theme: Theme): MiniDioramaMaterialVariantName {
  return themeProfiles[theme].variant;
}

export function applyMiniDioramaTheme(assets: MiniDioramaSceneAssets, theme: Theme): void {
  createMiniDioramaThemeTransition(assets, theme)(1);
}

export function createMiniDioramaThemeTransition(
  assets: MiniDioramaSceneAssets,
  theme: Theme,
): MiniDioramaThemeTransition {
  const profile = themeProfiles[theme];
  assets.materialVariants.apply(profile.variant);

  const hemisphere = assets.themeTargets.hemisphere;
  const key = assets.themeTargets.keyLight;
  const fill = assets.themeTargets.fillLight;
  const lanterns = assets.themeTargets.lanternLights;
  const themeTargets: readonly ThemeLightTransition[] = [
    createLightTransition(
      hemisphere.color,
      hemisphere.intensity,
      profile.hemisphere[0],
      profile.hemisphere[2],
      (color) => {
        hemisphere.color.copy(color);
      },
      (intensity) => (hemisphere.intensity = intensity),
    ),
    createLightTransition(
      key.color,
      key.intensity,
      profile.key[0],
      profile.key[1],
      (color) => {
        key.color.copy(color);
      },
      (intensity) => (key.intensity = intensity),
    ),
    createLightTransition(
      fill.color,
      fill.intensity,
      profile.fill[0],
      profile.fill[1],
      (color) => {
        fill.color.copy(color);
      },
      (intensity) => (fill.intensity = intensity),
    ),
    ...lanterns.map((lantern) =>
      createLightTransition(
        lantern.color,
        lantern.intensity,
        profile.lantern[0],
        profile.lantern[1],
        (color) => {
          lantern.color.copy(color);
        },
        (intensity) => (lantern.intensity = intensity),
      ),
    ),
  ];
  const groundColor = createColorTransition(
    hemisphere.groundColor,
    profile.hemisphere[1],
    (color) => hemisphere.groundColor.copy(color),
  );
  const outdoorGround = assets.themeTargets.outdoorGround;
  const groundTint = outdoorGround?.surface.uniforms['uTint']?.value as THREE.Color | undefined;
  const groundOpacity = outdoorGround?.surface.uniforms['uOpacity'];
  const groundTintColor = groundTint
    ? createColorTransition(groundTint, profile.groundTint, (color) => groundTint.copy(color))
    : undefined;
  const initialGroundOpacity = groundOpacity?.value as number | undefined;
  const markerTransitions = Object.values(assets.focusMarkers).map((marker) => {
    const material = marker.material as THREE.MeshBasicMaterial;
    return createColorTransition(material.color, profile.marker, (color) => {
      material.color.copy(color);
    });
  });

  return (progress) => {
    const amount = THREE.MathUtils.clamp(progress, 0, 1);
    groundColor(amount);
    groundTintColor?.(amount);
    if (groundOpacity && initialGroundOpacity !== undefined) {
      groundOpacity.value = THREE.MathUtils.lerp(
        initialGroundOpacity,
        profile.groundOpacity,
        amount,
      );
    }
    for (const target of themeTargets) {
      target.color(amount);
      target.intensity(amount);
    }
    for (const updateMarker of markerTransitions) updateMarker(amount);
  };
}

function createLightTransition(
  currentColor: THREE.Color,
  currentIntensity: number,
  targetColor: number,
  targetIntensity: number,
  applyColor: (color: THREE.Color) => void,
  applyIntensity: (intensity: number) => void,
): ThemeLightTransition {
  const color = createColorTransition(currentColor, targetColor, applyColor);
  const fromIntensity = currentIntensity;
  return {
    color,
    intensity: (progress) => {
      applyIntensity(THREE.MathUtils.lerp(fromIntensity, targetIntensity, progress));
    },
  };
}

function createColorTransition(
  currentColor: THREE.Color,
  targetColor: number,
  applyColor: (color: THREE.Color) => void,
): MiniDioramaThemeTransition {
  const from = currentColor.clone();
  const to = new THREE.Color(targetColor);
  const color = new THREE.Color();
  return (progress) => {
    color.lerpColors(from, to, progress);
    applyColor(color);
  };
}
