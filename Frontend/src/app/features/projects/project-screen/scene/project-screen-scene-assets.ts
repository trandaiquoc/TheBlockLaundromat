import type { Theme } from '../../../../core/ui/theme/theme.service';

interface ProjectScreenImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

interface ProjectScreenSceneAssets {
  readonly room: ProjectScreenImageAsset;
  readonly referenceBoardCleanup?: ProjectScreenImageAsset;
  readonly exterior?: ProjectScreenImageAsset;
  readonly roomMask?: ProjectScreenImageAsset;
  readonly washer?: ProjectScreenImageAsset;
  readonly board?: ProjectScreenImageAsset;
  readonly foreground?: ProjectScreenImageAsset;
  readonly mapMascot?: ProjectScreenImageAsset;
}

export type ProjectScreenMascotState = 'idle' | 'create' | 'selected' | 'opening';

const ref4Layer = (name: string, width: number, height: number): ProjectScreenImageAsset => ({
  src: `assets/project-screen/layers/ref4/${name}`,
  width,
  height,
});

const roomLayer = (name: string, width: number, height: number): ProjectScreenImageAsset => ({
  src: `assets/project-screen/layers/${name}`,
  width,
  height,
});

export const PROJECT_SCREEN_EXTERIOR_PANORAMA = roomLayer('exterior-panorama.jpg', 1828, 860);
const sharedRoom = ref4Layer('scene-light.jpg', 1831, 859);
const sharedRoomMask = roomLayer('room-mask-light.png', 1831, 859);
const craftRoom = roomLayer('scene-minecraft-room-shell.png', 1672, 941);
const craftExterior = roomLayer('scene-minecraft-exterior-view.png', 1672, 941);
const craftReferenceBoardCleanup = roomLayer('scene-minecraft-board-cleanup.png', 1672, 941);
const lightWasher = ref4Layer('washer-light.webp', 1307, 1203);
const sharedBoard = ref4Layer('board-light.webp', 1402, 1122);
const sharedMapMascot = ref4Layer('map-mascot-light.webp', 1302, 1208);

function sharedRoomBackdrop(): Pick<ProjectScreenSceneAssets, 'room' | 'exterior' | 'roomMask'> {
  return {
    room: sharedRoom,
    exterior: PROJECT_SCREEN_EXTERIOR_PANORAMA,
    roomMask: sharedRoomMask,
  };
}

export const PROJECT_SCREEN_WASHER_MASCOT_STATES: Record<
  ProjectScreenMascotState,
  ProjectScreenImageAsset
> = {
  idle: roomLayer('raccoon-washer-idle.webp', 1254, 1254),
  create: roomLayer('raccoon-washer-create.webp', 1254, 1254),
  selected: roomLayer('raccoon-washer-selected.webp', 1254, 1254),
  opening: roomLayer('raccoon-washer-opening.webp', 1254, 1254),
};

export const PROJECT_SCREEN_SCENE_ASSETS: Record<Theme, ProjectScreenSceneAssets> = {
  craft: {
    room: craftRoom,
    exterior: craftExterior,
    referenceBoardCleanup: craftReferenceBoardCleanup,
  },
  light: {
    ...sharedRoomBackdrop(),
    washer: lightWasher,
    board: sharedBoard,
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    mapMascot: sharedMapMascot,
  },
  raccoon: {
    ...sharedRoomBackdrop(),
    washer: ref4Layer('washer-raccoon.webp', 1287, 1222),
    board: sharedBoard,
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    mapMascot: sharedMapMascot,
  },
  dark: {
    ...sharedRoomBackdrop(),
    washer: ref4Layer('washer-dark.webp', 1373, 1146),
    board: sharedBoard,
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    mapMascot: sharedMapMascot,
  },
};
