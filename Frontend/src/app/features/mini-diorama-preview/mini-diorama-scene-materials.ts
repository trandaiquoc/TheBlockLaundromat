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
  readonly raccoonFur: THREE.MeshStandardMaterial;
  readonly raccoonHeadFur: THREE.MeshStandardMaterial;
  readonly raccoonPatch: THREE.MeshStandardMaterial;
  readonly raccoonCream: THREE.MeshStandardMaterial;
  readonly raccoonFaceMarking: THREE.MeshStandardMaterial;
  readonly raccoonEyeMask: THREE.MeshStandardMaterial;
  readonly raccoonNose: THREE.MeshStandardMaterial;
  readonly raccoonEye: THREE.MeshStandardMaterial;
  readonly raccoonEyeDetail: THREE.MeshStandardMaterial;
  readonly raccoonTail: THREE.MeshStandardMaterial;
  readonly washerEnamel: THREE.MeshStandardMaterial;
  readonly washerShade: THREE.MeshStandardMaterial;
  readonly washerGasket: THREE.MeshStandardMaterial;
  readonly drum: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshStandardMaterial;
  readonly shadow: THREE.MeshStandardMaterial;
}

type Palette = Readonly<Record<keyof MiniDioramaSceneMaterials, number>>;

const sharedWoodAndCharacter = {
  floorboard: 0x92704e,
  floorboardAlt: 0xa07c57,
  floorSeam: 0x4f392b,
  oak: 0x8b5d3d,
  oakLight: 0xb88657,
  oakDark: 0x5f402f,
  raccoonFur: 0x8c8275,
  raccoonHeadFur: 0xbab09e,
  raccoonPatch: 0x796656,
  raccoonCream: 0xe9deca,
  raccoonFaceMarking: 0xe9deca,
  raccoonEyeMask: 0x796656,
  raccoonNose: 0x493a34,
  raccoonEye: 0x40342f,
  raccoonEyeDetail: 0xf1e5d2,
  raccoonTail: 0xbab09e,
  shadow: 0x402f24,
} as const;

const themePalettes: Readonly<Record<Theme, Palette>> = {
  craft: {
    wall: 0xe8d7bd,
    wallTrim: 0xf1e4d0,
    ...sharedWoodAndCharacter,
    sage: 0x71826a,
    terracotta: 0xa96448,
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
    glass: 0x887762,
  },
  light: {
    wall: 0xf0e4d0,
    wallTrim: 0xf7eddd,
    ...sharedWoodAndCharacter,
    sage: 0x788d77,
    terracotta: 0xb36f55,
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
    glass: 0x9a8873,
  },
  raccoon: {
    wall: 0xe2d3ba,
    wallTrim: 0xf0e3cd,
    ...sharedWoodAndCharacter,
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
    glass: 0x817360,
  },
  dark: {
    wall: 0x504438,
    wallTrim: 0x77624a,
    ...sharedWoodAndCharacter,
    floorboard: 0x77583f,
    floorboardAlt: 0x856547,
    floorSeam: 0x3e2f25,
    oak: 0x754d35,
    oakLight: 0xa3744d,
    oakDark: 0x493326,
    sage: 0x718574,
    terracotta: 0xb77358,
    brass: 0xb28a53,
    linen: 0xd9cab0,
    linenBlue: 0x8d9e97,
    linenRose: 0xb47e6c,
    ink: 0x463a31,
    cork: 0x8e6749,
    raccoonFur: 0x978c7d,
    raccoonHeadFur: 0xc9bea9,
    raccoonTail: 0xc9bea9,
    washerEnamel: 0xcab99b,
    washerShade: 0x9d8668,
    washerGasket: 0x40342c,
    drum: 0x57483d,
    glass: 0x70604f,
  },
};

const backgroundColors: Readonly<Record<Theme, number>> = {
  craft: 0xd7c4a6,
  light: 0xe8dcc7,
  raccoon: 0xd1c2a6,
  dark: 0x322b25,
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
    roughness = 0.9,
    metalness = 0,
    extras: THREE.MeshStandardMaterialParameters = {},
  ) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extras });
  const woodGrain = createWoodGrainTexture();
  const wood = (color: number, roughness = 0.95) =>
    standard(color, roughness, 0, { map: woodGrain });

  return {
    wall: standard(0xe2d3ba, 0.96),
    wallTrim: standard(0xf0e3cd, 0.92),
    floorboard: wood(0x92704e),
    floorboardAlt: wood(0xa07c57),
    floorSeam: standard(0x4f392b, 0.98),
    oak: wood(0x8b5d3d),
    oakLight: wood(0xb88657, 0.93),
    oakDark: wood(0x5f402f),
    sage: standard(0x71826a, 0.94),
    terracotta: standard(0xa96448, 0.96),
    brass: standard(0xa9824f, 0.64, 0.22),
    linen: standard(0xeadfc9, 0.99),
    linenBlue: standard(0xa9b8b1, 0.97),
    linenRose: standard(0xc9957e, 0.98),
    ink: standard(0x55463a, 0.97),
    cork: standard(0x98704e, 0.98),
    raccoonFur: standard(0x8c8275, 0.98),
    raccoonHeadFur: standard(0xbab09e, 0.98),
    raccoonPatch: standard(0x796656, 0.98),
    raccoonCream: standard(0xe9deca, 0.98),
    raccoonFaceMarking: standard(0xe9deca, 0.98, 0, {
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    raccoonEyeMask: standard(0x796656, 0.98, 0, {
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    raccoonNose: standard(0x493a34, 0.92),
    raccoonEye: standard(0x40342f, 0.92),
    raccoonEyeDetail: standard(0xf1e5d2, 0.96),
    raccoonTail: standard(0xbab09e, 0.98, 0, { vertexColors: true }),
    washerEnamel: standard(0xe5d9c3, 0.82),
    washerShade: standard(0xc6b294, 0.88),
    washerGasket: standard(0x534338, 0.94),
    drum: standard(0x5d5146, 0.88),
    glass: standard(0x817360, 0.72, 0, { transparent: true, opacity: 0.82, depthWrite: false }),
    shadow: standard(0x402f24, 0.98, 0, { transparent: true, opacity: 0.16, depthWrite: false }),
  };
}

function createWoodGrainTexture(): THREE.DataTexture {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 2171;

  for (let y = 0; y < size; y++) {
    const broadGrain = Math.sin(y * 0.055 + Math.sin(y * 0.018) * 1.8) * 0.012;
    const fineGrain = Math.sin(y * 0.29 + Math.sin(y * 0.07) * 0.8) * 0.006;
    for (let x = 0; x < size; x++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const variation = (seed / 0xffffffff - 0.5) * 0.01;
      const value = Math.round(
        255 * THREE.MathUtils.clamp(0.98 + broadGrain + fineGrain + variation, 0.93, 1),
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
  texture.repeat.set(1.25, 1);
  texture.needsUpdate = true;
  return texture;
}
