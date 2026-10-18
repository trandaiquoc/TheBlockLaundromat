import type { Theme } from '../../../../core/ui/theme/theme.service';

interface ProjectScreenImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

interface ProjectScreenImageDimensions {
  readonly width: number;
  readonly height: number;
}

interface ProjectScreenSceneAssets {
  readonly room: ProjectScreenImageAsset;
  readonly exterior: ProjectScreenImageAsset;
  readonly roomMask: ProjectScreenImageAsset;
  readonly washer: ProjectScreenImageAsset;
  readonly board: ProjectScreenImageAsset;
  readonly foreground: ProjectScreenImageAsset;
  readonly washerMascot: ProjectScreenImageAsset;
  readonly mapMascot: ProjectScreenImageAsset;
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

function splitRoomBackdrop(
  theme: Theme,
  dimensions: {
    readonly room: ProjectScreenImageDimensions;
    readonly roomMask: ProjectScreenImageDimensions;
  },
): Pick<ProjectScreenSceneAssets, 'room' | 'exterior' | 'roomMask'> {
  return {
    room: ref4Layer(`scene-${theme}.jpg`, dimensions.room.width, dimensions.room.height),
    exterior: PROJECT_SCREEN_EXTERIOR_PANORAMA,
    roomMask: roomLayer(
      `room-mask-${theme}.png`,
      dimensions.roomMask.width,
      dimensions.roomMask.height,
    ),
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
    ...splitRoomBackdrop('craft', {
      room: { width: 1828, height: 860 },
      roomMask: { width: 1825, height: 862 },
    }),
    washer: ref4Layer('washer-craft.webp', 1324, 1188),
    board: ref4Layer('board-craft.webp', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    washerMascot: ref4Layer('washer-mascot-craft.webp', 1334, 1179),
    mapMascot: ref4Layer('map-mascot-craft.webp', 1388, 1133),
  },
  light: {
    ...splitRoomBackdrop('light', {
      room: { width: 1831, height: 859 },
      roomMask: { width: 1831, height: 859 },
    }),
    washer: ref4Layer('washer-light.webp', 1307, 1203),
    board: ref4Layer('board-light.webp', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    washerMascot: ref4Layer('washer-mascot-light.webp', 1303, 1207),
    mapMascot: ref4Layer('map-mascot-light.webp', 1302, 1208),
  },
  raccoon: {
    ...splitRoomBackdrop('raccoon', {
      room: { width: 1832, height: 858 },
      roomMask: { width: 1832, height: 859 },
    }),
    washer: ref4Layer('washer-raccoon.webp', 1287, 1222),
    board: ref4Layer('board-raccoon.webp', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    washerMascot: ref4Layer('washer-mascot-raccoon.webp', 1311, 1200),
    mapMascot: ref4Layer('map-mascot-raccoon.webp', 1287, 1222),
  },
  dark: {
    ...splitRoomBackdrop('dark', {
      room: { width: 1829, height: 860 },
      roomMask: { width: 1828, height: 860 },
    }),
    washer: ref4Layer('washer-dark.webp', 1373, 1146),
    board: ref4Layer('board-dark.webp', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 664, 374),
    washerMascot: ref4Layer('washer-mascot-dark.webp', 1363, 1154),
    mapMascot: ref4Layer('map-mascot-dark.webp', 1374, 1145),
  },
};
