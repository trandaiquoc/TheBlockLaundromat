// @ts-expect-error Vitest checks the public asset contract in Node.
import { existsSync, readFileSync } from 'node:fs';
// @ts-expect-error Vitest checks the public asset contract in Node.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PROJECT_SCREEN_EXTERIOR_PANORAMA,
  PROJECT_SCREEN_SCENE_ASSETS,
  PROJECT_SCREEN_WASHER_MASCOT_STATES,
} from './project-screen-scene-assets';
import { ProjectScreenSceneComponent } from './project-screen-scene.component';

describe('Project Screen scene asset contract', () => {
  it('uses one shared exterior panorama with theme-specific opening masks', () => {
    const themes = Object.entries(PROJECT_SCREEN_SCENE_ASSETS);
    const sceneHashes = new Set<string>();
    const exteriorImage = readFileSync(
      PROJECT_SCREEN_EXTERIOR_PANORAMA.src.replace(/^assets\//, 'public/assets/'),
    );

    expect(themes).toHaveLength(4);
    expect(PROJECT_SCREEN_EXTERIOR_PANORAMA.src).toMatch(/layers\/exterior-panorama\.jpg$/);
    expect(exteriorImage.length).toBeLessThan(700_000);
    for (const [themeName, theme] of themes) {
      expect(theme.room.src).toMatch(new RegExp(`layers/ref4/scene-${themeName}\\.jpg$`));
      expect(theme.exterior).toBe(PROJECT_SCREEN_EXTERIOR_PANORAMA);
      expect(theme.room.width / theme.room.height).toBeGreaterThan(2);
      expect(theme.exterior.width / theme.exterior.height).toBeGreaterThan(2);
      expect(theme.roomMask.src).toMatch(new RegExp(`layers/room-mask-${themeName}\\.png$`));
      const roomImage = readFileSync(theme.room.src.replace(/^assets\//, 'public/assets/'));
      sceneHashes.add(createHash('sha256').update(roomImage).digest('hex'));
      expect(theme.washer.src).toMatch(new RegExp(`layers/ref4/washer-${themeName}\\.webp$`));
      expect(theme.board.src).toMatch(new RegExp(`layers/ref4/board-${themeName}\\.webp$`));
      expect(theme.washerMascot.src).toMatch(
        new RegExp(`layers/ref4/washer-mascot-${themeName}\\.webp$`),
      );
      expect(theme.mapMascot.src).toMatch(
        new RegExp(`layers/ref4/map-mascot-${themeName}\\.webp$`),
      );
      expect(theme.foreground.src).toMatch(/layers\/laundry-foreground\.webp$/);
      expect(theme.foreground.width).toBe(664);
      expect(theme.foreground.height).toBe(374);
    }
    expect(sceneHashes.size).toBe(4);
  });

  it('uses alpha-channel masks for the four window and doorway openings', () => {
    for (const theme of Object.values(PROJECT_SCREEN_SCENE_ASSETS)) {
      const mask = readFileSync(theme.roomMask.src.replace(/^assets\//, 'public/assets/'));
      expect([...mask.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(mask[25]).toBe(6);
      expect(mask.length).toBeLessThan(25_000);
    }
  });

  it('points every theme layer at an existing public asset with valid dimensions', () => {
    const assets = Object.values(PROJECT_SCREEN_SCENE_ASSETS).flatMap((theme) =>
      Object.values(theme),
    );

    for (const asset of assets) {
      expect(existsSync(asset.src.replace(/^assets\//, 'public/assets/'))).toBe(true);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });

  it('provides an image for each intentional washer mascot state', () => {
    expect(Object.keys(PROJECT_SCREEN_WASHER_MASCOT_STATES)).toEqual([
      'idle',
      'create',
      'selected',
      'opening',
    ]);
    for (const asset of Object.values(PROJECT_SCREEN_WASHER_MASCOT_STATES)) {
      expect(asset.src).toMatch(/layers\/raccoon-washer-.*\.webp$/);
      expect(existsSync(asset.src.replace(/^assets\//, 'public/assets/'))).toBe(true);
      expect(asset.width).toBe(1254);
      expect(asset.height).toBe(1254);
    }
  });

  it('switches the visible layered artwork and mask for each theme input', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectScreenSceneComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenSceneComponent);
    for (const [themeName, assets] of Object.entries(PROJECT_SCREEN_SCENE_ASSETS)) {
      fixture.componentRef.setInput('theme', themeName);
      fixture.detectChanges();

      const scene = fixture.nativeElement.querySelector('.scene-background') as HTMLElement;
      const exterior = fixture.nativeElement.querySelector(
        '.scene-layer--exterior',
      ) as HTMLImageElement;
      const lighting = fixture.nativeElement.querySelector(
        '.scene-layer--exterior-lighting',
      ) as HTMLElement;
      const room = fixture.nativeElement.querySelector('.scene-layer--room') as HTMLImageElement;

      expect(scene.dataset['theme']).toBe(themeName);
      expect(exterior.getAttribute('src')).toContain(assets.exterior.src);
      expect(lighting).not.toBeNull();
      expect(room.getAttribute('src')).toContain(assets.room.src);
      expect(room.style.getPropertyValue('--room-opening-mask')).toContain(assets.roomMask.src);
    }
    fixture.destroy();
  });

  it('transitions the shared exterior lighting and respects motion settings', () => {
    const styles = readFileSync(
      'src/app/features/projects/project-screen/scene/project-screen-scene.component.scss',
      'utf8',
    );

    expect(styles).toContain('transition: filter 900ms cubic-bezier(0.22, 1, 0.36, 1)');
    expect(styles).toContain('transition: background-color 900ms cubic-bezier(0.22, 1, 0.36, 1)');
    expect(styles).toContain(".scene-background[data-animations='false'] .scene-layer--exterior");
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
