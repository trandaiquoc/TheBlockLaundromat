import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { ThemeService } from '../../core/ui/theme/theme.service';
import type { Theme } from '../../core/ui/theme/theme.service';
import { HomespaceMasterSceneComponent } from './homespace-master-scene.component';
import {
  HOMESPACE_ARTBOARD,
  MINECRAFT_HOMESPACE_SCENE,
  homespaceSceneForTheme,
} from './homespace-scene-contract';

describe('HomespaceMasterSceneComponent', () => {
  it('composes separate Minecraft outside, interior, lighting, object, and UI layers', async () => {
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
      'assets/homespace/outside/minecraft-panorama.png',
    );
    expect(interior?.getAttribute('src')).toContain(
      'assets/homespace/interior/minecraft-room-shell.png',
    );
    expect(outside?.getAttribute('width')).toBe(String(HOMESPACE_ARTBOARD.width));
    expect(interior?.getAttribute('height')).toBe(String(HOMESPACE_ARTBOARD.height));
    expect(root.querySelector('.scene-lighting')).not.toBeNull();
    expect(root.querySelector('.scene-object-slot')).not.toBeNull();
    expect(root.querySelector('.scene-interactive-ui-slot .projective-surface')).not.toBeNull();
    expect(root.querySelectorAll('button, a, input, select, textarea')).toHaveLength(0);
    expect(root.querySelectorAll('img.scene-object')).toHaveLength(0);

    fixture.destroy();
  });

  it('keeps the artboard aligned and renders only implemented scene themes', () => {
    expect(HOMESPACE_ARTBOARD).toEqual({ width: 1672, height: 941 });
    expect(MINECRAFT_HOMESPACE_SCENE.theme).toBe('craft');
    expect(MINECRAFT_HOMESPACE_SCENE.layers.objects).toHaveLength(0);
    expect(homespaceSceneForTheme('light')).toBeNull();
    expect(homespaceSceneForTheme('raccoon')).toBeNull();
    expect(homespaceSceneForTheme('dark')).toBeNull();
  });

  it('removes the Minecraft scene when the selected theme has no scene asset', async () => {
    const theme = signal<Theme>('craft');
    await configureScene(theme);
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.homespace-viewport')).not.toBeNull();
    theme.set('light');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.homespace-viewport')).toBeNull();
    fixture.destroy();
  });

  it('pans horizontally and vertically with keyboard arrows', async () => {
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

    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(viewport.scrollLeft).toBe(0);

    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(viewport.scrollTop).toBe(400);
    viewport.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    );
    expect(viewport.scrollTop).toBe(0);
    fixture.destroy();
  });

  it('pans the overflowing scene axis by dragging', async () => {
    await configureScene();
    const fixture = TestBed.createComponent(HomespaceMasterSceneComponent);
    fixture.detectChanges();

    const viewport = fixture.nativeElement.querySelector('.homespace-viewport') as HTMLDivElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 800 },
      scrollLeft: { configurable: true, writable: true, value: 100 },
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1200 },
      scrollTop: { configurable: true, writable: true, value: 200 },
    });

    const stage = fixture.nativeElement.querySelector('.homespace-stage') as HTMLDivElement;
    stage.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
    document.dispatchEvent(createPointerEvent('pointermove', 110, 40));
    document.dispatchEvent(createPointerEvent('pointerup', 110, 40));

    expect(viewport.scrollTop).toBe(260);
    expect(viewport.scrollLeft).toBe(100);
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
