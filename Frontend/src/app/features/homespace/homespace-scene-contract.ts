import type { Theme } from '../../core/ui/theme/theme.service';

export interface ScenePoint {
  readonly x: number;
  readonly y: number;
}

export interface HomespaceProjectionSurface {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly corners: readonly [ScenePoint, ScenePoint, ScenePoint, ScenePoint];
}

interface SceneImageLayer {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export interface HomespaceSceneDefinition {
  readonly theme: Theme;
  readonly layers: {
    readonly outside: SceneImageLayer;
    readonly interior: SceneImageLayer;
    readonly objects: readonly SceneImageLayer[];
    readonly lighting: {
      readonly preset: 'warm-daylight';
      readonly opacity: number;
    };
    readonly interactiveUi: {
      readonly projectBoard: HomespaceProjectionSurface;
    };
  };
}

export const HOMESPACE_ARTBOARD = {
  width: 1672,
  height: 941,
} as const;

const projectBoardSurface: HomespaceProjectionSurface = {
  id: 'project-board',
  width: 480,
  height: 355,
  corners: [
    { x: 1028, y: 320 },
    { x: 1509, y: 310 },
    { x: 1512, y: 674 },
    { x: 1024, y: 687 },
  ],
};

export const MINECRAFT_HOMESPACE_SCENE: HomespaceSceneDefinition = {
  theme: 'craft',
  layers: {
    outside: {
      src: 'assets/homespace/outside/minecraft-panorama.png',
      ...HOMESPACE_ARTBOARD,
    },
    interior: {
      src: 'assets/homespace/interior/minecraft-room-shell.png',
      ...HOMESPACE_ARTBOARD,
    },
    objects: [],
    lighting: {
      preset: 'warm-daylight',
      opacity: 0.035,
    },
    interactiveUi: {
      projectBoard: projectBoardSurface,
    },
  },
};

const sceneByTheme: Partial<Record<Theme, HomespaceSceneDefinition>> = {
  craft: MINECRAFT_HOMESPACE_SCENE,
};

export function homespaceSceneForTheme(theme: Theme): HomespaceSceneDefinition | null {
  return sceneByTheme[theme] ?? null;
}
