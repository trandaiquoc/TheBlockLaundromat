export interface MiniDioramaSceneProfile {
  readonly id: string;
  readonly sceneAssetPath: string;
  readonly washerAssetPath: string;
  readonly exteriorGroundTexturePath: string;
  readonly placements: readonly {
    readonly nodeName: string;
    readonly offset: readonly [number, number, number];
  }[];
  readonly ground: {
    readonly planeExtentScale: number;
    readonly innerBoundsScale: number;
    readonly fadeDistanceScale: number;
    readonly textureRepeat: number;
    readonly tint: number;
    readonly opacity: number;
    readonly contactStrength: number;
    readonly shadowColor: number;
    readonly shadowOpacity: number;
    readonly surfaceHeightOffset: number;
    readonly shadowHeightOffset: number;
  };
}

const cabinetContents = [
  'LeftCabinet',
  'WestIvy',
  'ShelfFern',
  'ShelfLantern',
  'LinenBasket',
  'BasketBlueRoll',
  'BasketIvoryRoll',
  'SageWashBox',
  'OchreWashBox',
  'CabinetTowel1',
  'CabinetTowel2',
  'CabinetTowel3',
  'SeafoamPitcher',
  'CabinetBlueTin',
  'ApothecaryBottle',
  'CeramicPump',
  'LaundryLedger',
  'WrappedSoap',
  'CreamWashBox',
  'Marigold',
] as const;

const cabinetPlacements = cabinetContents.map((nodeName) => ({
  nodeName,
  offset: nodeName === 'WestIvy' ? ([0.18, 0.25, -1.1] as const) : ([0, 0, -1.1] as const),
}));

/** Runtime assets and presentation tuning for the current production room. */
export const DEFAULT_MINI_DIORAMA_SCENE_PROFILE: MiniDioramaSceneProfile = {
  id: 'production-default',
  sceneAssetPath: 'assets/homepage/runtime/models/Room/Octagonal-Laundromat.glb',
  washerAssetPath: 'assets/homepage/runtime/models/Props/Washer-Alternate/Washer.glb',
  exteriorGroundTexturePath:
    'assets/homepage/runtime/textures/mini-diorama/exterior-forest-floor.png',
  placements: cabinetPlacements,
  ground: {
    planeExtentScale: 3.2,
    innerBoundsScale: 0.57,
    fadeDistanceScale: 0.78,
    textureRepeat: 8,
    tint: 0xe9efd9,
    opacity: 0.86,
    contactStrength: 0.52,
    shadowColor: 0x1a2029,
    shadowOpacity: 0.32,
    surfaceHeightOffset: -0.045,
    shadowHeightOffset: 0.002,
  },
};
