import type { Theme } from '../../../../core/ui/theme/theme.service';

interface ProjectScreenImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

interface ProjectScreenSceneAssets {
  readonly background: ProjectScreenImageAsset;
  readonly exterior: ProjectScreenImageAsset;
  readonly washer: ProjectScreenImageAsset;
  readonly board: ProjectScreenImageAsset;
  readonly foreground: ProjectScreenImageAsset;
  readonly washerMascot: ProjectScreenImageAsset;
  readonly mapMascot: ProjectScreenImageAsset;
}

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

export const PROJECT_SCREEN_SCENE_ASSETS: Record<Theme, ProjectScreenSceneAssets> = {
  craft: {
    background: ref4Layer('scene-craft.jpg', 1828, 860),
    exterior: roomLayer('exterior-craft.webp', 1672, 941),
    washer: ref4Layer('washer-craft.png', 1324, 1188),
    board: ref4Layer('board-craft.png', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 1672, 941),
    washerMascot: ref4Layer('washer-mascot-craft.png', 1334, 1179),
    mapMascot: ref4Layer('map-mascot-craft.png', 1388, 1133),
  },
  light: {
    background: ref4Layer('scene-light.jpg', 1831, 859),
    exterior: roomLayer('exterior-light.webp', 1672, 941),
    washer: ref4Layer('washer-light.png', 1307, 1203),
    board: ref4Layer('board-light.png', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 1672, 941),
    washerMascot: ref4Layer('washer-mascot-light.png', 1303, 1207),
    mapMascot: ref4Layer('map-mascot-light.png', 1302, 1208),
  },
  raccoon: {
    background: ref4Layer('scene-raccoon.jpg', 1832, 858),
    exterior: roomLayer('exterior-raccoon.webp', 1672, 941),
    washer: ref4Layer('washer-raccoon.png', 1287, 1222),
    board: ref4Layer('board-raccoon.png', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 1672, 941),
    washerMascot: ref4Layer('washer-mascot-raccoon.png', 1311, 1200),
    mapMascot: ref4Layer('map-mascot-raccoon.png', 1287, 1222),
  },
  dark: {
    background: ref4Layer('scene-dark.jpg', 1829, 860),
    exterior: roomLayer('exterior-dark.webp', 1672, 941),
    washer: ref4Layer('washer-dark.png', 1373, 1146),
    board: ref4Layer('board-dark.png', 1402, 1122),
    foreground: roomLayer('laundry-foreground.webp', 1672, 941),
    washerMascot: ref4Layer('washer-mascot-dark.png', 1363, 1154),
    mapMascot: ref4Layer('map-mascot-dark.png', 1374, 1145),
  },
};
