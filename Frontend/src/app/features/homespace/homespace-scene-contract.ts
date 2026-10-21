import type { Theme } from '../../core/ui/theme/theme.service';

export interface HomespacePoint {
  readonly x: number;
  readonly y: number;
}

export interface HomespaceBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HomespaceImageSource {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export type HomespaceAssetRole = 'environment' | 'room-shell' | 'object' | 'surface';
export type HomespaceRenderPlane =
  'environment' | 'behind-shell' | 'room-shell' | 'foreground' | 'projected-ui';

export interface HomespaceProjectedPlane {
  readonly width: number;
  readonly height: number;
  readonly corners: readonly [HomespacePoint, HomespacePoint, HomespacePoint, HomespacePoint];
}

export interface HomespaceSemanticAnchor {
  readonly id: string;
  readonly localPosition: HomespacePoint;
  readonly bounds: HomespaceBounds;
  readonly acceptsTags: readonly string[];
  readonly depth: number;
  readonly projectedPlane?: HomespaceProjectedPlane;
}

export interface HomespaceAssetAppearance {
  readonly id: string;
  readonly theme: Theme | null;
  readonly image: HomespaceImageSource | null;
}

export interface HomespaceAssetDefinition {
  readonly id: string;
  readonly role: HomespaceAssetRole;
  readonly bounds: HomespaceBounds;
  readonly tags: readonly string[];
  readonly defaultAppearanceId: string;
  readonly appearances: readonly HomespaceAssetAppearance[];
  readonly anchors: readonly HomespaceSemanticAnchor[];
  readonly renderPlane: HomespaceRenderPlane;
  readonly depth: number;
}

export interface HomespacePlacement {
  readonly parentInstanceId: string | null;
  readonly anchorId: string | null;
  readonly localPosition: HomespacePoint;
  readonly scale: number;
  readonly depth: number;
}

export interface HomespaceAssetInstance {
  readonly id: string;
  readonly assetId: string;
  readonly appearanceId: string;
  readonly placement: HomespacePlacement;
}

export interface HomespaceSceneDefinition {
  readonly theme: Theme;
  readonly artboard: { readonly width: number; readonly height: number };
  readonly instances: readonly HomespaceAssetInstance[];
  readonly lighting: { readonly opacity: number };
}

export interface HomespaceProjectionSurface {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly corners: readonly [HomespacePoint, HomespacePoint, HomespacePoint, HomespacePoint];
}

export interface HomespaceResolvedProjectionSurface extends HomespaceProjectionSurface {
  readonly instanceId: string;
}

export const HOMESPACE_ARTBOARD = {
  width: 1672,
  height: 941,
} as const;

export const HOMESPACE_COORDINATES = {
  unit: 'artboard-pixel',
  origin: 'top-left',
  positiveX: 'right',
  positiveY: 'down',
  scale: 'uniform-from-artboard-height',
} as const;

const outsideImage: HomespaceImageSource = {
  src: 'assets/homespace/temporary/outside/minecraft-panorama.png',
  ...HOMESPACE_ARTBOARD,
};

const roomShellImage: HomespaceImageSource = {
  src: 'assets/homespace/temporary/interior/minecraft-room-shell.png',
  width: 1671,
  height: HOMESPACE_ARTBOARD.height,
};

const noImageAppearance: HomespaceAssetAppearance = {
  id: 'projected-ui',
  theme: null,
  image: null,
};

const outsideAppearances: readonly HomespaceAssetAppearance[] = [
  { id: 'minecraft-day', theme: 'craft', image: outsideImage },
];

const roomShellAppearances: readonly HomespaceAssetAppearance[] = [
  { id: 'minecraft-day', theme: 'craft', image: roomShellImage },
];

const projectBoardPlane: HomespaceProjectedPlane = {
  width: 547,
  height: 314,
  corners: [
    { x: 0, y: 9 },
    { x: 547, y: 0 },
    { x: 541, y: 314 },
    { x: 5, y: 314 },
  ],
};

export const HOMESPACE_ASSETS: Readonly<Record<string, HomespaceAssetDefinition>> = {
  'minecraft-outside-panorama': {
    id: 'minecraft-outside-panorama',
    role: 'environment',
    bounds: { x: 0, y: 0, ...HOMESPACE_ARTBOARD },
    tags: ['scene-environment'],
    defaultAppearanceId: 'minecraft-day',
    appearances: outsideAppearances,
    anchors: [],
    renderPlane: 'environment',
    depth: 0,
  },
  'minecraft-room-shell': {
    id: 'minecraft-room-shell',
    role: 'room-shell',
    bounds: { x: 0, y: 0, width: 1671, height: HOMESPACE_ARTBOARD.height },
    tags: ['scene-interior'],
    defaultAppearanceId: 'minecraft-day',
    appearances: roomShellAppearances,
    anchors: [
      {
        id: 'project-board-mount',
        localPosition: { x: 329, y: 196 },
        bounds: { x: 0, y: 0, width: projectBoardPlane.width, height: projectBoardPlane.height },
        acceptsTags: ['projected-ui'],
        depth: 0,
        projectedPlane: projectBoardPlane,
      },
    ],
    renderPlane: 'room-shell',
    depth: 200,
  },
  'project-board-surface': {
    id: 'project-board-surface',
    role: 'surface',
    bounds: { x: 0, y: 0, width: projectBoardPlane.width, height: projectBoardPlane.height },
    tags: ['projected-ui'],
    defaultAppearanceId: noImageAppearance.id,
    appearances: [noImageAppearance],
    anchors: [],
    renderPlane: 'projected-ui',
    depth: 0,
  },
};

const basePlacements = {
  outside: {
    parentInstanceId: null,
    anchorId: null,
    localPosition: { x: 0, y: 0 },
    scale: 1,
    depth: 0,
  },
  roomShell: {
    parentInstanceId: null,
    anchorId: null,
    localPosition: { x: 0.5, y: 0 },
    scale: 1,
    depth: 0,
  },
  projectBoard: {
    parentInstanceId: 'minecraft-room-shell-instance',
    anchorId: 'project-board-mount',
    localPosition: { x: 0, y: 0 },
    scale: 1,
    depth: 0,
  },
} as const;

export const MINECRAFT_HOMESPACE_SCENE: HomespaceSceneDefinition = {
  theme: 'craft',
  artboard: HOMESPACE_ARTBOARD,
  instances: [
    {
      id: 'minecraft-outside-panorama-instance',
      assetId: HOMESPACE_ASSETS['minecraft-outside-panorama'].id,
      appearanceId: 'minecraft-day',
      placement: basePlacements.outside,
    },
    {
      id: 'minecraft-room-shell-instance',
      assetId: HOMESPACE_ASSETS['minecraft-room-shell'].id,
      appearanceId: 'minecraft-day',
      placement: basePlacements.roomShell,
    },
    {
      id: 'minecraft-project-board-instance',
      assetId: HOMESPACE_ASSETS['project-board-surface'].id,
      appearanceId: noImageAppearance.id,
      placement: basePlacements.projectBoard,
    },
  ],
  lighting: { opacity: 0 },
};

const sceneByTheme: Partial<Record<Theme, HomespaceSceneDefinition>> = {
  craft: MINECRAFT_HOMESPACE_SCENE,
};

export function homespaceSceneForTheme(theme: Theme): HomespaceSceneDefinition | null {
  return sceneByTheme[theme] ?? null;
}
