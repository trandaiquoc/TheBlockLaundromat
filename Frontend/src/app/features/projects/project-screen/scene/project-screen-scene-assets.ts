import type { Theme } from '../../../../core/ui/theme/theme.service';

interface ProjectScreenImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

interface ProjectScreenSceneAssets {
  readonly background: ProjectScreenImageAsset;
  readonly washer: ProjectScreenImageAsset;
  readonly board: ProjectScreenImageAsset;
  readonly washerMascot: ProjectScreenImageAsset;
  readonly mapMascot: ProjectScreenImageAsset;
}

const layer = (name: string, width: number, height: number): ProjectScreenImageAsset => ({
  src: `assets/project-screen/layers/ref4/${name}`,
  width,
  height,
});

export const PROJECT_SCREEN_SCENE_ASSETS: Record<Theme, ProjectScreenSceneAssets> = {
  craft: {
    background: layer('scene-craft.jpg', 1828, 860),
    washer: layer('washer-craft.png', 1324, 1188),
    board: layer('board-craft.png', 1402, 1122),
    washerMascot: layer('washer-mascot-craft.png', 1334, 1179),
    mapMascot: layer('map-mascot-craft.png', 1388, 1133),
  },
  light: {
    background: layer('scene-light.jpg', 1831, 859),
    washer: layer('washer-light.png', 1307, 1203),
    board: layer('board-light.png', 1402, 1122),
    washerMascot: layer('washer-mascot-light.png', 1303, 1207),
    mapMascot: layer('map-mascot-light.png', 1302, 1208),
  },
  raccoon: {
    background: layer('scene-raccoon.jpg', 1832, 858),
    washer: layer('washer-raccoon.png', 1287, 1222),
    board: layer('board-raccoon.png', 1402, 1122),
    washerMascot: layer('washer-mascot-raccoon.png', 1311, 1200),
    mapMascot: layer('map-mascot-raccoon.png', 1287, 1222),
  },
  dark: {
    background: layer('scene-dark.jpg', 1829, 860),
    washer: layer('washer-dark.png', 1373, 1146),
    board: layer('board-dark.png', 1402, 1122),
    washerMascot: layer('washer-mascot-dark.png', 1363, 1154),
    mapMascot: layer('map-mascot-dark.png', 1374, 1145),
  },
};
