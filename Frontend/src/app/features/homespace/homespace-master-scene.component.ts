import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { ThemeService } from '../../core/ui/theme/theme.service';
import { HomespaceProjectiveSurfaceComponent } from './homespace-projective-surface.component';
import { homespaceSceneForTheme } from './homespace-scene-contract';
import { homespaceSceneViewportLayout } from './homespace-scene-layout';
import { resolveHomespaceScene } from './homespace-scene-placement';

interface PanGesture {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly startScrollLeft: number;
  axis: 'pending' | 'horizontal' | 'cancelled';
}

const INTERACTIVE_TARGET_SELECTOR =
  'a, button, input, textarea, select, summary, [contenteditable="true"], [role="button"], [role="link"], .outer-topbar, .project-page-content, .project-page-footer';
const PAN_THRESHOLD_PX = 6;
const MIN_PAN_RANGE_PX = 2;
const KEYBOARD_PAN_FRACTION = 0.8;

@Component({
  selector: 'app-homespace-master-scene',
  imports: [NgOptimizedImage, HomespaceProjectiveSurfaceComponent],
  templateUrl: './homespace-master-scene.component.html',
  styleUrl: './homespace-master-scene.component.scss',
})
export class HomespaceMasterSceneComponent {
  protected readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  protected readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');
  protected readonly scene = computed(() => {
    const definition = homespaceSceneForTheme(this.theme.theme());
    return definition ? resolveHomespaceScene(definition) : null;
  });
  protected readonly layout = signal({
    stageWidth: 0,
    stageHeight: 0,
    scale: 0,
    horizontalOverflow: 0,
    canPanHorizontally: false,
  });
  protected readonly dragging = signal(false);

  private panGesture: PanGesture | null = null;

  constructor() {
    this.connectViewportLayout();
    const stopListening = [
      this.renderer.listen('document', 'pointerdown', (event: PointerEvent) =>
        this.beginPan(event),
      ),
      this.renderer.listen('document', 'pointermove', (event: PointerEvent) =>
        this.continuePan(event),
      ),
      this.renderer.listen('document', 'pointerup', (event: PointerEvent) => this.endPan(event)),
      this.renderer.listen('document', 'pointercancel', (event: PointerEvent) =>
        this.endPan(event),
      ),
    ];
    this.destroyRef.onDestroy(() => stopListening.forEach((stop) => stop()));
  }

  protected panWithKeyboard(event: KeyboardEvent): void {
    if (
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    if (maxScrollLeft < MIN_PAN_RANGE_PX) return;

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    viewport.scrollLeft = Math.max(
      0,
      Math.min(
        maxScrollLeft,
        viewport.scrollLeft + direction * viewport.clientWidth * KEYBOARD_PAN_FRACTION,
      ),
    );
    event.preventDefault();
  }

  private connectViewportLayout(): void {
    effect((onCleanup) => {
      const viewport = this.viewport()?.nativeElement;
      const scene = this.scene();
      if (
        !viewport ||
        !scene ||
        !isPlatformBrowser(this.platformId) ||
        typeof ResizeObserver === 'undefined'
      ) {
        return;
      }

      const observer = new ResizeObserver(() => this.updateLayout(viewport));
      observer.observe(viewport);
      this.updateLayout(viewport);
      onCleanup(() => observer.disconnect());
    });
  }

  private updateLayout(viewport: HTMLDivElement): void {
    const scene = this.scene();
    if (!scene) return;
    this.layout.set(
      homespaceSceneViewportLayout(
        { width: viewport.clientWidth, height: viewport.clientHeight },
        scene.definition,
      ),
    );
  }

  private beginPan(event: PointerEvent): void {
    if (!this.scene() || event.pointerType === 'touch') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const page = this.hostElementParent();
    if (!page?.contains(event.target as Node) || this.isInteractiveTarget(event.target)) return;

    const viewport = this.viewport()?.nativeElement;
    if (!viewport || viewport.scrollWidth - viewport.clientWidth < MIN_PAN_RANGE_PX) return;

    this.panGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      axis: 'pending',
    };
  }

  private continuePan(event: PointerEvent): void {
    const gesture = this.panGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!this.scene()) {
      this.cancelPan();
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (gesture.axis === 'pending') {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < PAN_THRESHOLD_PX) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        gesture.axis = 'cancelled';
        return;
      }
      gesture.axis = 'horizontal';
    }
    if (gesture.axis === 'cancelled') return;

    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
    if (maxScrollLeft < MIN_PAN_RANGE_PX) return;
    this.dragging.set(true);
    viewport.scrollLeft = Math.max(0, Math.min(maxScrollLeft, gesture.startScrollLeft - deltaX));
    event.preventDefault();
  }

  private endPan(event: PointerEvent): void {
    if (!this.panGesture || event.pointerId !== this.panGesture.pointerId) return;
    this.cancelPan();
  }

  private cancelPan(): void {
    this.panGesture = null;
    this.dragging.set(false);
  }

  private hostElementParent(): HTMLElement | null {
    return this.hostElement.nativeElement.parentElement;
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
  }
}
