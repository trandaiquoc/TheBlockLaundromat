// @ts-expect-error Vitest checks the public asset contract in Node.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  PROJECT_SCREEN_SCENE_ASSETS,
  PROJECT_SCREEN_WASHER_MASCOT_STATES,
} from './project-screen-scene-assets';
import { ProjectScreenSceneComponent } from './project-screen-scene.component';

describe('Project Screen scene asset contract', () => {
  it('uses the Minecraft reference art set for the Minecraft theme', () => {
    const craft = PROJECT_SCREEN_SCENE_ASSETS.craft;
    const reference = readFileSync('../Docs/design/references/01-minecraft.png');
    const runtimeReference = readFileSync(
      'public/assets/project-screen/layers/scene-minecraft-reference.png',
    );
    const createProjectTile = readFileSync(
      'public/assets/project-screen/layers/create-project-tile-craft.png',
    );

    expect([...reference.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(reference.readUInt32BE(16)).toBe(1672);
    expect(reference.readUInt32BE(20)).toBe(941);
    expect(runtimeReference.equals(reference)).toBe(true);
    expect(craft.room.src).toMatch(/layers\/scene-minecraft-reference\.png$/);
    expect(craft.room.width).toBe(1672);
    expect(craft.room.height).toBe(941);
    expect(craft.exterior).toBeUndefined();
    expect(craft.roomMask).toBeUndefined();
    expect(craft.washer).toBeUndefined();
    expect(craft.board).toBeUndefined();
    expect(craft.foreground).toBeUndefined();
    expect(craft.mapMascot).toBeUndefined();
    expect([...createProjectTile.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(createProjectTile.readUInt32BE(16)).toBe(142);
    expect(createProjectTile.readUInt32BE(20)).toBe(156);
  });

  it('keeps alpha-channel masks for themes with a separate outdoor layer', () => {
    const mask = readFileSync(
      PROJECT_SCREEN_SCENE_ASSETS.light.roomMask!.src.replace(/^assets\//, 'public/assets/'),
    );
    expect([...mask.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(mask[25]).toBe(6);
    expect(mask.length).toBeLessThan(25_000);
  });

  it('points every theme layer at an existing public asset with valid dimensions', () => {
    const assets = Object.values(PROJECT_SCREEN_SCENE_ASSETS).flatMap((theme) =>
      Object.values(theme).filter((asset) => asset !== undefined),
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
      const roomLighting = fixture.nativeElement.querySelector(
        '.scene-layer--room-lighting',
      ) as HTMLElement;
      const ambientLighting = fixture.nativeElement.querySelector(
        '.scene-layer--ambient-lighting',
      ) as HTMLElement;

      expect(scene.dataset['theme']).toBe(themeName);
      if (themeName === 'craft') {
        expect(exterior).toBeNull();
        expect(lighting).toBeNull();
        expect(roomLighting).toBeNull();
        expect(room.style.getPropertyValue('--room-opening-mask')).toBe('');
      } else {
        expect(assets.exterior).toBeDefined();
        expect(exterior.getAttribute('src')).toContain(assets.exterior!.src);
        expect(lighting).not.toBeNull();
        expect(roomLighting.style.getPropertyValue('--room-opening-mask')).toContain(
          assets.roomMask!.src,
        );
      }
      expect(ambientLighting !== null).toBe(themeName !== 'craft');
      expect(room.getAttribute('src')).toContain(assets.room.src);
      if (assets.roomMask) {
        expect(room.style.getPropertyValue('--room-opening-mask')).toContain(assets.roomMask.src);
      }
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
    expect(styles).toContain('.scene-layer--room-lighting');
    expect(styles).toContain('.scene-layer--ambient-lighting');
    expect(styles).toContain(".scene-background[data-theme='craft']");
    expect(styles).toContain(".scene-background[data-theme='raccoon']");
    expect(styles).toContain(".scene-background[data-theme='dark']");
    expect(styles).toContain('--washer-filter: brightness(0.88) saturate(0.92)');
    expect(styles).toContain('.scene-layer--washer-mascot > img');
    expect(styles).toContain(".scene-background[data-animations='false'] .scene-layer--exterior");
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
