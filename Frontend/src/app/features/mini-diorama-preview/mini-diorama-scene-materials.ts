import * as THREE from 'three';
import type { Theme } from '../../core/ui/theme/theme.service';

export interface MiniDioramaSceneMaterials {
  readonly wall: THREE.MeshStandardMaterial;
  readonly wallTrim: THREE.MeshStandardMaterial;
  readonly floorboard: THREE.MeshStandardMaterial;
  readonly floorboardAlt: THREE.MeshStandardMaterial;
  readonly floorSeam: THREE.MeshStandardMaterial;
  readonly oak: THREE.MeshStandardMaterial;
  readonly oakLight: THREE.MeshStandardMaterial;
  readonly oakDark: THREE.MeshStandardMaterial;
  readonly sage: THREE.MeshStandardMaterial;
  readonly terracotta: THREE.MeshStandardMaterial;
  readonly brass: THREE.MeshStandardMaterial;
  readonly linen: THREE.MeshStandardMaterial;
  readonly linenBlue: THREE.MeshStandardMaterial;
  readonly linenRose: THREE.MeshStandardMaterial;
  readonly ink: THREE.MeshStandardMaterial;
  readonly cork: THREE.MeshStandardMaterial;
  readonly washerEnamel: THREE.MeshStandardMaterial;
  readonly washerShade: THREE.MeshStandardMaterial;
  readonly washerGasket: THREE.MeshStandardMaterial;
  readonly drum: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshStandardMaterial;
  readonly shadow: THREE.MeshStandardMaterial;
}

type Palette = Readonly<Record<keyof MiniDioramaSceneMaterials, number>>;

export interface MiniDioramaSceneThemeTargets {
  readonly hemisphere: THREE.HemisphereLight;
  readonly keyLight: THREE.DirectionalLight;
  readonly fillLight: THREE.DirectionalLight;
  readonly warmBounce: THREE.PointLight;
  readonly pendantLights: readonly THREE.PointLight[];
  readonly window: {
    readonly sky: THREE.MeshBasicMaterial;
    readonly horizon: THREE.MeshBasicMaterial;
    readonly sun: THREE.MeshBasicMaterial;
    readonly duskSun: THREE.MeshBasicMaterial;
    readonly moon: THREE.MeshBasicMaterial;
    readonly clouds: THREE.MeshBasicMaterial;
    readonly nightAccent: THREE.MeshBasicMaterial;
    readonly stars: THREE.Group;
    readonly dayDetails: THREE.Group;
    readonly duskDetails: THREE.Group;
    readonly nightDetails: THREE.Group;
  };
}

interface ThemeProfile {
  readonly materials: Palette;
  readonly background: number;
  readonly fogFar: number;
  readonly hemisphere: readonly [number, number, number];
  readonly key: readonly [number, number];
  readonly fill: readonly [number, number];
  readonly bounce: readonly [number, number];
  readonly pendantIntensity: number;
  readonly window: Readonly<{
    sky: number;
    horizon: number;
    sun: number;
    duskSun: number;
    moon: number;
    clouds: number;
    nightAccent: number;
    details: 'day' | 'dusk' | 'night';
  }>;
}

const sharedWood = {
  floorboard: 0x92704e,
  floorboardAlt: 0xa07c57,
  floorSeam: 0x4f392b,
  oak: 0x8b5d3d,
  oakLight: 0xb88657,
  oakDark: 0x5f402f,
  shadow: 0x402f24,
} as const;

const lightWood = {
  floorboard: 0xaf885d,
  floorboardAlt: 0xc19a6c,
  floorSeam: 0x755844,
  oak: 0xa5764d,
  oakLight: 0xc69a68,
  oakDark: 0x76533b,
  shadow: 0x574838,
} as const;

const themeProfiles: Readonly<Record<Theme, ThemeProfile>> = {
  craft: {
    materials: {
      wall: 0xe8d7bd,
      wallTrim: 0xf1e4d0,
      ...sharedWood,
      sage: 0x648347,
      terracotta: 0xca713d,
      brass: 0xa9824f,
      linen: 0xeadfc9,
      linenBlue: 0xa9b8b1,
      linenRose: 0xc9957e,
      ink: 0x55463a,
      cork: 0x98704e,
      washerEnamel: 0xe7dcc8,
      washerShade: 0xc7b497,
      washerGasket: 0x574439,
      drum: 0x645447,
      glass: 0x789ca0,
    },
    background: 0xd7c4a6,
    fogFar: 28,
    hemisphere: [0xfff0d5, 0x604833, 1.75],
    key: [0xffdda7, 2.25],
    fill: [0xc6d9e9, 0.7],
    bounce: [0xffc486, 4.5],
    pendantIntensity: 1.6,
    window: {
      sky: 0x83b5bd,
      horizon: 0x698a70,
      sun: 0xffdc8a,
      duskSun: 0xe9a078,
      moon: 0xf2e7c0,
      clouds: 0xd8d8bd,
      nightAccent: 0x93b9b4,
      details: 'day',
    },
  },
  light: {
    materials: {
      wall: 0xf0e4d0,
      wallTrim: 0xf7eddd,
      ...lightWood,
      sage: 0x99a88c,
      terracotta: 0xb38268,
      brass: 0xb08d5c,
      linen: 0xf0e7d6,
      linenBlue: 0xb3c3bd,
      linenRose: 0xd3a18c,
      ink: 0x57483c,
      cork: 0xa37b58,
      washerEnamel: 0xf1e8d8,
      washerShade: 0xd6c5a9,
      washerGasket: 0x625044,
      drum: 0x756452,
      glass: 0x9cb6bd,
    },
    background: 0xe8dcc7,
    fogFar: 32,
    hemisphere: [0xfff8e8, 0x7f887a, 2.0],
    key: [0xfff0d5, 3.0],
    fill: [0xd8e8f0, 1.15],
    bounce: [0xffe7c0, 2.2],
    pendantIntensity: 0.85,
    window: {
      sky: 0xa6d5e3,
      horizon: 0xa8b790,
      sun: 0xffe69b,
      duskSun: 0xe7a68e,
      moon: 0xf4edda,
      clouds: 0xebf5ef,
      nightAccent: 0xa6c6ce,
      details: 'day',
    },
  },
  raccoon: {
    materials: {
      wall: 0xe2d3ba,
      wallTrim: 0xf0e3cd,
      ...sharedWood,
      sage: 0x687f6b,
      terracotta: 0xaa674b,
      brass: 0xa77e4d,
      linen: 0xece0c9,
      linenBlue: 0xa8bbb4,
      linenRose: 0xc98f79,
      ink: 0x4c4137,
      cork: 0x966e4c,
      washerEnamel: 0xe5d9c3,
      washerShade: 0xc6b294,
      washerGasket: 0x534338,
      drum: 0x5d5146,
      glass: 0x78939f,
    },
    background: 0x4b3f59,
    fogFar: 24,
    hemisphere: [0xd7c4ea, 0x3f3448, 1.3],
    key: [0xffb375, 1.35],
    fill: [0x9e9acc, 0.72],
    bounce: [0xff9448, 6.2],
    pendantIntensity: 3.0,
    window: {
      sky: 0x594c70,
      horizon: 0x9a6172,
      sun: 0xf7cb89,
      duskSun: 0xffa66f,
      moon: 0xe5dbef,
      clouds: 0x86728b,
      nightAccent: 0xa5a2d5,
      details: 'dusk',
    },
  },
  dark: {
    materials: {
      wall: 0x3e4860,
      wallTrim: 0x65718a,
      ...sharedWood,
      floorboard: 0x594b45,
      floorboardAlt: 0x69584c,
      floorSeam: 0x302d38,
      oak: 0x62432f,
      oakLight: 0x8f6846,
      oakDark: 0x382d35,
      sage: 0x718574,
      terracotta: 0xb77358,
      brass: 0xb28a53,
      linen: 0xd9cab0,
      linenBlue: 0x8d9e97,
      linenRose: 0xb47e6c,
      ink: 0x463a31,
      cork: 0x755944,
      washerEnamel: 0xcab99b,
      washerShade: 0x9d8668,
      washerGasket: 0x40342c,
      drum: 0x353847,
      glass: 0x385767,
    },
    background: 0x1b263d,
    fogFar: 21,
    hemisphere: [0x8da5cd, 0x232a45, 0.48],
    key: [0x88aee4, 1.1],
    fill: [0x7ba3d6, 0.65],
    bounce: [0xffbf65, 8.2],
    pendantIntensity: 4.4,
    window: {
      sky: 0x142443,
      horizon: 0x1b3d50,
      sun: 0xe6ddbe,
      duskSun: 0xb890a8,
      moon: 0xe2e7f0,
      clouds: 0x455878,
      nightAccent: 0x62c5d2,
      details: 'night',
    },
  },
};

export function applyMiniDioramaTheme(
  scene: THREE.Scene,
  materials: MiniDioramaSceneMaterials,
  theme: Theme,
  targets: MiniDioramaSceneThemeTargets,
): void {
  const profile = themeProfiles[theme];
  const palette = profile.materials;
  for (const key of Object.keys(palette) as (keyof Palette)[]) {
    materials[key].color.setHex(palette[key]);
  }
  const background = new THREE.Color(profile.background);
  scene.background = background;
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.color.copy(background);
    scene.fog.far = profile.fogFar;
  }

  targets.hemisphere.color.setHex(profile.hemisphere[0]);
  targets.hemisphere.groundColor.setHex(profile.hemisphere[1]);
  targets.hemisphere.intensity = profile.hemisphere[2];
  targets.keyLight.color.setHex(profile.key[0]);
  targets.keyLight.intensity = profile.key[1];
  targets.fillLight.color.setHex(profile.fill[0]);
  targets.fillLight.intensity = profile.fill[1];
  targets.warmBounce.color.setHex(profile.bounce[0]);
  targets.warmBounce.intensity = profile.bounce[1];
  for (const pendant of targets.pendantLights) pendant.intensity = profile.pendantIntensity;

  targets.window.sky.color.setHex(profile.window.sky);
  targets.window.horizon.color.setHex(profile.window.horizon);
  targets.window.sun.color.setHex(profile.window.sun);
  targets.window.duskSun.color.setHex(profile.window.duskSun);
  targets.window.moon.color.setHex(profile.window.moon);
  targets.window.clouds.color.setHex(profile.window.clouds);
  targets.window.nightAccent.color.setHex(profile.window.nightAccent);
  targets.window.dayDetails.visible = profile.window.details === 'day';
  targets.window.duskDetails.visible = profile.window.details === 'dusk';
  targets.window.nightDetails.visible = profile.window.details === 'night';
  targets.window.stars.visible = profile.window.details === 'night';
}

export function createMiniDioramaSceneMaterials(): MiniDioramaSceneMaterials {
  const standard = (
    color: number,
    roughness = 0.9,
    metalness = 0,
    extras: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extras });
  const pixelTexture = createPixelSurfaceTexture();
  const voxel = (color: number, roughness = 0.94, metalness = 0) =>
    standard(color, roughness, metalness, { map: pixelTexture });
  const woodGrain = createWoodGrainTexture();
  const wood = (color: number, roughness = 0.95) =>
    standard(color, roughness, 0, { map: woodGrain });

  return {
    wall: voxel(0xe2d3ba, 0.98),
    wallTrim: voxel(0xf0e3cd, 0.92),
    floorboard: wood(0x92704e),
    floorboardAlt: wood(0xa07c57),
    floorSeam: voxel(0x4f392b, 0.98),
    oak: wood(0x8b5d3d),
    oakLight: wood(0xb88657, 0.93),
    oakDark: wood(0x5f402f),
    sage: voxel(0x71826a),
    terracotta: voxel(0xa96448),
    brass: voxel(0xa9824f, 0.74, 0.08),
    linen: voxel(0xeadfc9, 0.99),
    linenBlue: voxel(0xa9b8b1, 0.97),
    linenRose: voxel(0xc9957e, 0.98),
    ink: voxel(0x55463a, 0.97),
    cork: voxel(0x98704e, 0.98),
    washerEnamel: voxel(0xe5d9c3, 0.82),
    washerShade: voxel(0xc6b294, 0.88),
    washerGasket: voxel(0x534338, 0.94),
    drum: voxel(0x5d5146, 0.88),
    glass: voxel(0x817360, 0.72),
    shadow: standard(0x402f24, 0.98, 0, { transparent: true, opacity: 0.16, depthWrite: false }),
  };
}

function createWoodGrainTexture(): THREE.DataTexture {
  const size = 16;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 2171;

  for (let y = 0; y < size; y++) {
    const broadGrain = Math.sin(y * 0.8 + Math.sin(y * 0.23) * 1.8) * 0.045;
    const fineGrain = Math.sin(y * 2.4 + Math.sin(y * 0.7) * 0.8) * 0.018;
    for (let x = 0; x < size; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const variation = (seed / 0xffffffff - 0.5) * 0.035;
      const value = Math.round(
        255 * THREE.MathUtils.clamp(0.94 + broadGrain + fineGrain + variation, 0.79, 1),
      );
      const pixel = (y * size + x) * 4;
      pixels[pixel] = value;
      pixels[pixel + 1] = value;
      pixels[pixel + 2] = value;
      pixels[pixel + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.repeat.set(1.25, 1);
  texture.needsUpdate = true;
  return texture;
}

function createPixelSurfaceTexture(): THREE.DataTexture {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 635;

  for (let index = 0; index < size * size; index++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = Math.round(255 * (seed / 0xffffffff > 0.78 ? 0.965 : 1));
    const pixel = index * 4;
    pixels[pixel] = value;
    pixels[pixel + 1] = value;
    pixels[pixel + 2] = value;
    pixels[pixel + 3] = 255;
  }

  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
