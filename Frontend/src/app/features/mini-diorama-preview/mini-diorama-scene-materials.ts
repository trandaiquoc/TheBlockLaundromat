import * as THREE from 'three';
import type { Theme } from '../../core/ui/theme/theme.service';

export interface MiniDioramaSceneMaterials {
  readonly wall: THREE.MeshStandardMaterial;
  readonly wallLight: THREE.MeshStandardMaterial;
  readonly floor: THREE.MeshStandardMaterial;
  readonly grout: THREE.MeshStandardMaterial;
  readonly teal: THREE.MeshStandardMaterial;
  readonly darkTeal: THREE.MeshStandardMaterial;
  readonly mint: THREE.MeshStandardMaterial;
  readonly coral: THREE.MeshStandardMaterial;
  readonly peach: THREE.MeshStandardMaterial;
  readonly butter: THREE.MeshStandardMaterial;
  readonly paper: THREE.MeshStandardMaterial;
  readonly paperBlue: THREE.MeshStandardMaterial;
  readonly paperPink: THREE.MeshStandardMaterial;
  readonly ink: THREE.MeshStandardMaterial;
  readonly fur: THREE.MeshStandardMaterial;
  readonly furLight: THREE.MeshStandardMaterial;
  readonly mask: THREE.MeshStandardMaterial;
  readonly muzzle: THREE.MeshStandardMaterial;
  readonly nose: THREE.MeshStandardMaterial;
  readonly eye: THREE.MeshStandardMaterial;
  readonly iris: THREE.MeshStandardMaterial;
  readonly highlight: THREE.MeshStandardMaterial;
  readonly washer: THREE.MeshStandardMaterial;
  readonly washerShade: THREE.MeshStandardMaterial;
  readonly metal: THREE.MeshStandardMaterial;
  readonly drum: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshStandardMaterial;
  readonly shadow: THREE.MeshStandardMaterial;
}

const themePalettes: Readonly<
  Record<Theme, Readonly<Record<keyof MiniDioramaSceneMaterials, number>>>
> = {
  craft: {
    wall: 0xcbd1b7,
    wallLight: 0xe5dbbd,
    floor: 0xbca77d,
    grout: 0x988e70,
    teal: 0x647b5d,
    darkTeal: 0x465747,
    mint: 0xa5aa68,
    coral: 0xb97356,
    peach: 0xd09c70,
    butter: 0xe0bd70,
    paper: 0xede3c9,
    paperBlue: 0x9baea3,
    paperPink: 0xd6a391,
    ink: 0x43574b,
    fur: 0x717a6b,
    furLight: 0xb4b79d,
    mask: 0x343d34,
    muzzle: 0xf0e6cc,
    nose: 0x493c40,
    eye: 0xfff3dc,
    iris: 0x2c4145,
    highlight: 0xffffff,
    washer: 0xd8d6c2,
    washerShade: 0xc0c7b4,
    metal: 0x8e9b8d,
    drum: 0x435a55,
    glass: 0x80b7be,
    shadow: 0x34453d,
  },
  light: {
    wall: 0xe5eee7,
    wallLight: 0xfff5e4,
    floor: 0xeee5d5,
    grout: 0xc9c3b2,
    teal: 0x6c9691,
    darkTeal: 0x355f63,
    mint: 0xa2d4bd,
    coral: 0xe98376,
    peach: 0xf5b691,
    butter: 0xf2c86f,
    paper: 0xfff7e6,
    paperBlue: 0x9dbdd0,
    paperPink: 0xeeb1a6,
    ink: 0x34545a,
    fur: 0x717f82,
    furLight: 0xaab5ad,
    mask: 0x293a40,
    muzzle: 0xf3e3c9,
    nose: 0x493c40,
    eye: 0xfff3dc,
    iris: 0x2c4145,
    highlight: 0xffffff,
    washer: 0xf5f0e6,
    washerShade: 0xd4ddd6,
    metal: 0x9aa9a6,
    drum: 0x4d6568,
    glass: 0x80b7be,
    shadow: 0x35585b,
  },
  raccoon: {
    wall: 0xd8e9df,
    wallLight: 0xf4ead6,
    floor: 0xece0c9,
    grout: 0xc9c3b2,
    teal: 0x3a7473,
    darkTeal: 0x244f54,
    mint: 0x95c9b4,
    coral: 0xe98376,
    peach: 0xf5b691,
    butter: 0xf2c86f,
    paper: 0xfff7e6,
    paperBlue: 0x9dbdd0,
    paperPink: 0xeeb1a6,
    ink: 0x34545a,
    fur: 0x717f82,
    furLight: 0xaab5ad,
    mask: 0x293a40,
    muzzle: 0xf3e3c9,
    nose: 0x493c40,
    eye: 0xfff3dc,
    iris: 0x2c4145,
    highlight: 0xffffff,
    washer: 0xf5f0e6,
    washerShade: 0xd4ddd6,
    metal: 0x9aa9a6,
    drum: 0x4d6568,
    glass: 0x80b7be,
    shadow: 0x35585b,
  },
  dark: {
    wall: 0x34444a,
    wallLight: 0x5a6868,
    floor: 0x344047,
    grout: 0x29363b,
    teal: 0x41676a,
    darkTeal: 0x20383d,
    mint: 0x76ad99,
    coral: 0xc9786d,
    peach: 0xd79d7c,
    butter: 0xd9b96f,
    paper: 0xe3dbc7,
    paperBlue: 0x829faa,
    paperPink: 0xc98e87,
    ink: 0x263a3e,
    fur: 0x657276,
    furLight: 0x9ba9a4,
    mask: 0x263337,
    muzzle: 0xe7dbc0,
    nose: 0x302d32,
    eye: 0xfff0d2,
    iris: 0x243b40,
    highlight: 0xffffff,
    washer: 0xaebbb8,
    washerShade: 0x7e9291,
    metal: 0x82908f,
    drum: 0x34494d,
    glass: 0x689da5,
    shadow: 0x172a2d,
  },
};

const backgroundColors: Readonly<Record<Theme, number>> = {
  craft: 0xb9c8b2,
  light: 0xd9e7e4,
  raccoon: 0xb9d7d2,
  dark: 0x26383d,
};

export function applyMiniDioramaTheme(
  scene: THREE.Scene,
  materials: MiniDioramaSceneMaterials,
  theme: Theme,
): void {
  const palette = themePalettes[theme];
  for (const key of Object.keys(palette) as (keyof MiniDioramaSceneMaterials)[]) {
    materials[key].color.setHex(palette[key]);
  }
  const background = new THREE.Color(backgroundColors[theme]);
  scene.background = background;
  if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(background);
}

export function createMiniDioramaSceneMaterials(): MiniDioramaSceneMaterials {
  const standard = (
    color: number,
    roughness = 0.78,
    metalness = 0,
    extras: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extras });

  return {
    wall: standard(0xd8e9df),
    wallLight: standard(0xf4ead6),
    floor: standard(0xece0c9),
    grout: standard(0xc9c3b2, 0.9),
    teal: standard(0x3a7473, 0.72),
    darkTeal: standard(0x244f54, 0.75),
    mint: standard(0x95c9b4, 0.72),
    coral: standard(0xe98376, 0.58),
    peach: standard(0xf5b691, 0.62),
    butter: standard(0xf2c86f, 0.65),
    paper: standard(0xfff7e6, 0.94),
    paperBlue: standard(0x9dbdd0, 0.82),
    paperPink: standard(0xeeb1a6, 0.8),
    ink: standard(0x34545a, 0.85),
    fur: standard(0x717f82, 0.96),
    furLight: standard(0xaab5ad, 0.97),
    mask: standard(0x293a40, 0.78),
    muzzle: standard(0xf3e3c9, 0.92),
    nose: standard(0x493c40, 0.42),
    eye: standard(0xfff3dc, 0.3),
    iris: standard(0x2c4145, 0.28),
    highlight: standard(0xffffff, 0.14, 0, { emissive: 0xffffff, emissiveIntensity: 0.08 }),
    washer: standard(0xf5f0e6, 0.48),
    washerShade: standard(0xd4ddd6, 0.55),
    metal: standard(0x9aa9a6, 0.28, 0.78),
    drum: standard(0x4d6568, 0.36, 0.48),
    glass: standard(0x80b7be, 0.2, 0.25, { transparent: true, opacity: 0.28, depthWrite: false }),
    shadow: standard(0x35585b, 0.96, 0, { transparent: true, opacity: 0.16, depthWrite: false }),
  };
}
