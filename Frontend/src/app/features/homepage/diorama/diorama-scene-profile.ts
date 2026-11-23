import { PropertyBinding } from 'three';
import type { DioramaFocus, DioramaTarget } from './diorama-contracts';

export interface DioramaSceneProfile {
  readonly id: string;
  readonly roomAssetPath: string;
  readonly washerAssetPath: string;
  readonly exteriorGroundTexturePath: string;
  readonly nodeNames: {
    readonly interactionNodes: Readonly<Record<DioramaTarget, string>>;
    readonly raccoonRoots: readonly string[];
    readonly raccoonControllerRoot?: string;
    readonly lanternLightNodes: readonly string[];
    readonly boardBoundsAnchors: readonly string[];
    readonly washerAnchors: {
      readonly preview: string;
      readonly open: string;
      readonly delete: string;
      readonly projectName: string;
      readonly projectNameTopLeft: string;
      readonly projectNameBottomRight: string;
    };
    readonly washerSurfaceMeshes: {
      readonly preview: string;
      readonly open: string;
      readonly delete: string;
    };
    readonly cameraFocusAnchors: Readonly<Record<DioramaFocus, string>>;
    readonly requiredAnchors: readonly string[];
    readonly roomSpinPivot: string;
  };
  readonly placements: readonly {
    readonly nodeName: string;
    readonly offset: readonly [number, number, number];
  }[];
  readonly renderer: {
    readonly alpha: boolean;
    readonly antialias: boolean;
    readonly powerPreference: WebGLPowerPreference;
    readonly maximumPixelRatio: number;
    readonly toneMappingExposure: number;
  };
  readonly shadows: {
    readonly mapSize: number;
    readonly materialVariantsChangeCasterSilhouette: boolean;
    readonly dynamicCasterRoots: readonly string[];
  };
  readonly camera: {
    readonly fieldOfView: number;
    readonly near: number;
    readonly far: number;
  };
  readonly lighting: {
    readonly hemisphere: readonly [sky: number, ground: number, intensity: number];
    readonly key: {
      readonly color: number;
      readonly intensity: number;
      readonly positionScale: readonly [number, number, number];
      readonly shadowBias: number;
      readonly shadowNormalBias: number;
    };
    readonly fill: {
      readonly color: number;
      readonly intensity: number;
      readonly positionScale: readonly [number, number, number];
    };
    readonly lantern: {
      readonly color: number;
      readonly intensity: number;
      readonly distanceScale: number;
      readonly decay: number;
    };
  };
  readonly focusMarker: {
    readonly baseColor: number;
    readonly minimumRadius: number;
    readonly radiusScale: number;
    readonly groundOffset: number;
    readonly selectedOpacity: number;
    readonly hoveredOpacity: number;
    readonly selectedScale: number;
    readonly hoveredScale: number;
  };
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
  readonly motion: {
    readonly themeTransitionDurationSeconds: number;
    readonly roomSpinDurationSeconds: number;
    readonly roomSpinRadians: number;
    readonly raccoonIdleEnabled: boolean;
    readonly roomSpinFocuses: readonly DioramaFocus[];
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

/** Authored node contract and presentation settings for the laundromat room. */
export const LAUNDROMAT_DIORAMA_PROFILE: DioramaSceneProfile = {
  id: 'laundromat-diorama',
  roomAssetPath: 'assets/homepage/diorama/Octagonal-Laundromat.glb',
  washerAssetPath: 'assets/homepage/diorama/washer-alternate/Washer.glb',
  exteriorGroundTexturePath: 'assets/homepage/diorama/forest-floor.png',
  nodeNames: {
    interactionNodes: {
      washer: 'Washer',
      'project-board': 'ProjectBoard',
      raccoon: 'Courier.Root',
    },
    raccoonRoots: ['Courier.Root', 'Guide.Root'],
    lanternLightNodes: ['Anchor.NicheLantern.Light', 'Anchor.ShelfLantern.Light'],
    boardBoundsAnchors: [
      'Anchor.Board.BottomLeft',
      'Anchor.Board.BottomRight',
      'Anchor.Board.TopLeft',
      'Anchor.Board.TopRight',
    ],
    washerAnchors: {
      preview: 'Anchor.Washer.Preview',
      open: 'Anchor.Washer.Open',
      delete: 'Anchor.Washer.Delete',
      projectName: 'Anchor.Washer.ProjectName',
      projectNameTopLeft: 'Anchor.Washer.ProjectName.TopLeft',
      projectNameBottomRight: 'Anchor.Washer.ProjectName.BottomRight',
    },
    washerSurfaceMeshes: {
      preview: 'Washer.PreviewGlass',
      open: 'Washer.Open.Keycap',
      delete: 'Washer.Delete.Keycap',
    },
    cameraFocusAnchors: {
      overview: 'Anchor.Camera.Overview',
      washer: 'Anchor.Camera.Washer',
      'project-board': 'Anchor.Camera.Board',
      raccoon: 'Anchor.Camera.Portrait',
    },
    requiredAnchors: [
      'Anchor.Board.Center',
      'Anchor.Camera.Recenter',
      'Courier.Anchor.Note',
    ],
    roomSpinPivot: 'DioramaRoomSpinPivot',
  },
  placements: cabinetPlacements,
  renderer: {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    maximumPixelRatio: 1.35,
    toneMappingExposure: 1.08,
  },
  shadows: {
    mapSize: 1024,
    materialVariantsChangeCasterSilhouette: false,
    dynamicCasterRoots: ['Courier.Root'],
  },
  camera: { fieldOfView: 37, near: 0.1, far: 100 },
  lighting: {
    hemisphere: [0xfff0d5, 0x604833, 1.6],
    key: {
      color: 0xffdda7,
      intensity: 2.1,
      positionScale: [-0.8, 1, 1],
      shadowBias: -0.00025,
      shadowNormalBias: 0.035,
    },
    fill: {
      color: 0xc6d9e9,
      intensity: 0.62,
      positionScale: [1, 0.6, -1],
    },
    lantern: { color: 0xffc486, intensity: 3.4, distanceScale: 2, decay: 2 },
  },
  focusMarker: {
    baseColor: 0xe4b56c,
    minimumRadius: 0.4,
    radiusScale: 0.62,
    groundOffset: 0.035,
    selectedOpacity: 0.46,
    hoveredOpacity: 0.3,
    selectedScale: 1.08,
    hoveredScale: 1.04,
  },
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
  motion: {
    themeTransitionDurationSeconds: 0.48,
    roomSpinDurationSeconds: 0.95,
    roomSpinRadians: Math.PI * 2,
    raccoonIdleEnabled: false,
    roomSpinFocuses: ['overview', 'raccoon'],
  },
};

export function dioramaSceneNodeName(authoredName: string): string {
  return PropertyBinding.sanitizeNodeName(authoredName);
}

export function requiredDioramaSceneNodes(profile = LAUNDROMAT_DIORAMA_PROFILE): readonly string[] {
  const names = profile.nodeNames;
  return [
    ...Object.entries(names.interactionNodes)
      .filter(([target]) => target !== 'washer')
      .map(([, name]) => name),
    ...names.raccoonRoots,
    ...profile.shadows.dynamicCasterRoots,
    ...names.lanternLightNodes,
    ...profile.placements.map(({ nodeName }) => nodeName),
    ...names.boardBoundsAnchors,
    ...Object.values(names.cameraFocusAnchors),
    ...names.requiredAnchors,
  ].filter((name, index, all) => all.indexOf(name) === index);
}

export function requiredDioramaWasherNodes(
  profile = LAUNDROMAT_DIORAMA_PROFILE,
): readonly string[] {
  const anchors = profile.nodeNames.washerAnchors;
  return [
    profile.nodeNames.interactionNodes.washer,
    ...Object.values(anchors),
    ...Object.values(profile.nodeNames.washerSurfaceMeshes),
  ];
}
