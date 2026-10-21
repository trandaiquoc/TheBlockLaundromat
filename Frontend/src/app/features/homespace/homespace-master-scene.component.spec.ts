import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { ThemeService } from '../../core/ui/theme/theme.service';
import type { Theme } from '../../core/ui/theme/theme.service';
import { HomespaceMasterSceneComponent } from './homespace-master-scene.component';
import {
  DARK_HOMESPACE_SCENE,
  HOMESPACE_ARTBOARD,
  HOMESPACE_ASSETS,
  MINECRAFT_HOMESPACE_SCENE,
  homespaceSceneForTheme,
} from './homespace-scene-contract';
import { resolveHomespaceScene } from './homespace-scene-placement';

describe('HomespaceMasterSceneComponent', () => {
  it('composes the continuous panorama, undistorted room shell, and semantic layers', async () => {
    await configureScene();
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const outside = root.querySelector<HTMLImageElement>('.scene-outside');
    const interior = root.querySelector<HTMLImageElement>('.scene-interior');

    expect(root.querySelector('[role="region"]')?.getAttribute('aria-label')).toBe(
      'homespaceSceneDescription',
    );
    expect(outside?.getAttribute('src')).toContain(
      'assets/homespace/temporary/outside/minecraft-panorama.png',
    );
    expect(interior?.getAttribute('src')).toContain(
      'assets/homespace/temporary/interior/minecraft-room-shell.png',
    );
    expect(interior?.style.objectFit).toBe('contain');
    expect(root.querySelector('.scene-lighting')).not.toBeNull();
    expect(root.querySelector('.scene-object-slot')).not.toBeNull();
    expect(root.querySelector('.scene-interactive-ui-slot .projective-surface')).not.toBeNull();
    expect(root.querySelectorAll('button, a, input, select, textarea')).toHaveLength(0);
    expect(root.querySelectorAll('img.scene-object')).toHaveLength(0);
    expect(resolveHomespaceScene(MINECRAFT_HOMESPACE_SCENE).unresolved).toEqual([]);

    fixture.destroy();
  });

  it('keeps Dark on the Minecraft geometry and asset instances', () => {
    const minecraft = resolveHomespaceScene(MINECRAFT_HOMESPACE_SCENE);
    const dark = resolveHomespaceScene(DARK_HOMESPACE_SCENE);

    expect(HOMESPACE_ARTBOARD).toEqual({ width: 1672, height: 941 });
    expect(MINECRAFT_HOMESPACE_SCENE.theme).toBe('craft');
    expect(DARK_HOMESPACE_SCENE.theme).toBe('dark');
    expect(DARK_HOMESPACE_SCENE.artboard).toEqual(MINECRAFT_HOMESPACE_SCENE.artboard);
    expect(minecraft.instances.map(({ instance, asset }) => [instance.id, asset.id])).toEqual(
      dark.instances.map(({ instance, asset }) => [instance.id, asset.id]),
    );
    expect(MINECRAFT_HOMESPACE_SCENE.lighting).toEqual({ preset: 'natural', opacity: 0 });
    expect(DARK_HOMESPACE_SCENE.lighting).toEqual({ preset: 'cool-night', opacity: 0.82 });
    expect(homespaceSceneForTheme('light')).toBeNull();
    expect(homespaceSceneForTheme('raccoon')).toBeNull();
    expect(HOMESPACE_ASSETS['minecraft-room-shell'].bounds.width).toBe(1671);
    expect(minecraft.projectedSurfaces[0].instanceId).toBe('minecraft-project-board-instance');
  });

  it('changes only lighting when switching from Minecraft to Dark', async () => {
    const theme = signal<Theme>('craft');
    await configureScene(theme);
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    const outside = fixture.nativeElement.querySelector('.scene-outside') as HTMLImageElement;
    const room = fixture.nativeElement.querySelector('.scene-interior') as HTMLImageElement;
    const originalSources = [outside.getAttribute('src'), room.getAttribute('src')];
    expect(fixture.nativeElement.querySelector('.scene-lighting--cool-night')).toBeNull();

    theme.set('dark');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scene-lighting--cool-night')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.scene-lighting')?.style.opacity).toBe('0.82');
    expect([
      fixture.nativeElement.querySelector('.scene-outside')?.getAttribute('src'),
      fixture.nativeElement.querySelector('.scene-interior')?.getAttribute('src'),
    ]).toEqual(originalSources);
    fixture.destroy();
  });

  it('pans horizontally with arrow keys and never pans the scene vertically', async () => {
    await configureScene();
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector('.homespace-viewport') as HTMLDivElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 1000 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1200 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    });

    const right = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    viewport.dispatchEvent(right);
    expect(viewport.scrollLeft).toBe(320);
    expect(right.defaultPrevented).toBe(true);

    const down = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    viewport.dispatchEvent(down);
    expect(viewport.scrollTop).toBe(0);
    expect(down.defaultPrevented).toBe(false);
    fixture.destroy();
  });

  it('pans horizontally by mouse drag and ignores vertical drags', async () => {
    await configureScene();
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector('.homespace-viewport') as HTMLDivElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 800 },
      scrollLeft: { configurable: true, writable: true, value: 100 },
    });

    viewport.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
    document.dispatchEvent(createPointerEvent('pointermove', 70, 104));
    document.dispatchEvent(createPointerEvent('pointerup', 70, 104));
    expect(viewport.scrollLeft).toBe(130);

    viewport.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
    document.dispatchEvent(createPointerEvent('pointermove', 96, 130));
    document.dispatchEvent(createPointerEvent('pointerup', 96, 130));
    expect(viewport.scrollLeft).toBe(130);
    fixture.destroy();
  });
});

function createPointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY,
  }) as PointerEvent;
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'mouse' },
  });
  return event;
}

async function configureScene(theme = signal<Theme>('craft')): Promise<void> {
  TestBed.configureTestingModule({
    imports: [HomespaceMasterSceneComponent],
    providers: [
      { provide: I18nService, useValue: { t: () => 'homespaceSceneDescription' } },
      { provide: ThemeService, useValue: { theme } },
    ],
  });
  await TestBed.compileComponents();
}
