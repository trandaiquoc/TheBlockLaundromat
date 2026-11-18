import * as THREE from 'three';
import type { Theme } from '../../core/ui/theme/theme.service';
import type { MiniDioramaMaterialVariantName } from './mini-diorama-material-variants';
import type { MiniDioramaSceneAssets } from './mini-diorama-scene-assets';

interface SceneThemeProfile {
  readonly variant: MiniDioramaMaterialVariantName;
  readonly background: number;
  readonly hemisphere: readonly [sky: number, ground: number, intensity: number];
  readonly key: readonly [color: number, intensity: number];
  readonly fill: readonly [color: number, intensity: number];
  readonly lantern: readonly [color: number, intensity: number];
  readonly marker: number;
}

const themeProfiles: Readonly<Record<Theme, SceneThemeProfile>> = {
  craft: {
    variant: 'Minecraft',
    background: 0xd7c4a6,
    hemisphere: [0xfff0d5, 0x604833, 1.6],
    key: [0xffdda7, 2.1],
    fill: [0xc6d9e9, 0.62],
    lantern: [0xffc486, 3.4],
    marker: 0xe4b56c,
  },
  light: {
    variant: 'Light',
    background: 0xe8dcc7,
    hemisphere: [0xfff8e8, 0x7f887a, 1.9],
    key: [0xfff0d5, 2.6],
    fill: [0xd8e8f0, 0.95],
    lantern: [0xffe7c0, 1.8],
    marker: 0x8e9d7a,
  },
  raccoon: {
    variant: 'Raccoon',
    background: 0x4b3f59,
    hemisphere: [0xd7c4ea, 0x3f3448, 0.95],
    key: [0xffb375, 1.45],
    fill: [0x9e9acc, 0.72],
    lantern: [0xff9448, 5.4],
    marker: 0xd99f70,
  },
  dark: {
    variant: 'Dark',
    background: 0x1b263d,
    hemisphere: [0x8da5cd, 0x232a45, 0.5],
    key: [0x88aee4, 1.0],
    fill: [0x7ba3d6, 0.55],
    lantern: [0xffbf65, 7.2],
    marker: 0x69c5d0,
  },
};

export function miniDioramaVariantForTheme(theme: Theme): MiniDioramaMaterialVariantName {
  return themeProfiles[theme].variant;
}

export function applyMiniDioramaTheme(assets: MiniDioramaSceneAssets, theme: Theme): void {
  const profile = themeProfiles[theme];
  assets.materialVariants.apply(profile.variant);
  (assets.scene.background as THREE.Color).setHex(profile.background);

  assets.themeTargets.hemisphere.color.setHex(profile.hemisphere[0]);
  assets.themeTargets.hemisphere.groundColor.setHex(profile.hemisphere[1]);
  assets.themeTargets.hemisphere.intensity = profile.hemisphere[2];
  assets.themeTargets.keyLight.color.setHex(profile.key[0]);
  assets.themeTargets.keyLight.intensity = profile.key[1];
  assets.themeTargets.fillLight.color.setHex(profile.fill[0]);
  assets.themeTargets.fillLight.intensity = profile.fill[1];
  assets.themeTargets.lanternLight.color.setHex(profile.lantern[0]);
  assets.themeTargets.lanternLight.intensity = profile.lantern[1];

  for (const marker of Object.values(assets.focusMarkers)) {
    const material = marker.material as THREE.MeshBasicMaterial;
    material.color.setHex(profile.marker);
  }
}
