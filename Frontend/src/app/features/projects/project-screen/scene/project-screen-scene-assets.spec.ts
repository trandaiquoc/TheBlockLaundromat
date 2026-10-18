// @ts-expect-error Vitest checks the public asset contract in Node.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECT_SCREEN_SCENE_ASSETS } from './project-screen-scene-assets';

describe('Project Screen scene asset contract', () => {
  it('uses one fixed-frame scene image for each theme', () => {
    const scenes = Object.values(PROJECT_SCREEN_SCENE_ASSETS);

    expect(scenes).toHaveLength(4);
    expect(new Set(scenes).size).toBe(4);
    expect(scenes.every((scene) => scene.startsWith('assets/project-screen/scenes/'))).toBe(true);
    expect(scenes.every((scene) => scene.endsWith('.webp'))).toBe(true);
  });

  it('points every theme at an existing public asset', () => {
    const paths = Object.values(PROJECT_SCREEN_SCENE_ASSETS);

    expect(paths.every((path) => existsSync(path.replace(/^assets\//, 'public/assets/')))).toBe(
      true,
    );
  });
});
