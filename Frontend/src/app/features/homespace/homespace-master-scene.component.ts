import { NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { ThemeService } from '../../core/ui/theme/theme.service';
import { HomespaceProjectiveSurfaceComponent } from './homespace-projective-surface.component';
import { homespaceSceneForTheme } from './homespace-scene-contract';

interface PanGesture {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly startScrollLeft: number;
  readonly startScrollTop: number;
  axis: 'pending' | 'horizontal' | 'vertical';
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
export class HomespaceMasterSceneComponent implements AfterViewInit {
  protected readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  protected readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');
  protected readonly scene = computed(() => homespaceSceneForTheme(this.theme.theme()));
  protected readonly dragging = signal(false);

  private panGesture: PanGesture | null = null;

  constructor() {
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

  ngAfterViewInit(): void {
    this.centerVerticalOverflow();
    const stopListening = this.renderer.listen('window', 'resize', () =>
      this.centerVerticalOverflow(),
    );
    this.destroyRef.onDestroy(stopListening);
  }

  protected panWithKeyboard(event: KeyboardEvent): void {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) ||
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
    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (maxScrollLeft < MIN_PAN_RANGE_PX) return;
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      viewport.scrollLeft = Math.max(
        0,
        Math.min(
          maxScrollLeft,
          viewport.scrollLeft + direction * viewport.clientWidth * KEYBOARD_PAN_FRACTION,
        ),
      );
    } else {
      if (maxScrollTop < MIN_PAN_RANGE_PX) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      viewport.scrollTop = Math.max(
        0,
        Math.min(
          maxScrollTop,
          viewport.scrollTop + direction * viewport.clientHeight * KEYBOARD_PAN_FRACTION,
        ),
      );
    }
    event.preventDefault();
  }

  private beginPan(event: PointerEvent): void {
    if (!this.scene()) return;
    const page = this.hostElement.nativeElement.parentElement;
    if (!page?.contains(event.target as Node)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.isInteractiveTarget(event.target)) return;

    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    if (
      viewport.scrollWidth - viewport.clientWidth < MIN_PAN_RANGE_PX &&
      viewport.scrollHeight - viewport.clientHeight < MIN_PAN_RANGE_PX
    ) {
      return;
    }

    this.panGesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
      axis: 'pending',
    };
  }

  private continuePan(event: PointerEvent): void {
    const gesture = this.panGesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!this.scene()) {
      this.panGesture = null;
      this.dragging.set(false);
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (gesture.axis === 'pending') {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < PAN_THRESHOLD_PX) return;
      const viewport = this.viewport()?.nativeElement;
      if (!viewport) return;
      const canPanHorizontally = viewport.scrollWidth - viewport.clientWidth >= MIN_PAN_RANGE_PX;
      const canPanVertically = viewport.scrollHeight - viewport.clientHeight >= MIN_PAN_RANGE_PX;
      if (!canPanHorizontally && !canPanVertically) return;
      gesture.axis =
        canPanHorizontally && canPanVertically
          ? Math.abs(deltaX) > Math.abs(deltaY)
            ? 'horizontal'
            : 'vertical'
          : canPanHorizontally
            ? 'horizontal'
            : 'vertical';
    }

    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    if (gesture.axis === 'horizontal') {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;
      if (maxScrollLeft < MIN_PAN_RANGE_PX) return;
      this.dragging.set(true);
      viewport.scrollLeft = Math.max(0, Math.min(maxScrollLeft, gesture.startScrollLeft - deltaX));
    } else {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
      if (maxScrollTop < MIN_PAN_RANGE_PX) return;
      this.dragging.set(true);
      viewport.scrollTop = Math.max(0, Math.min(maxScrollTop, gesture.startScrollTop - deltaY));
    }
    event.preventDefault();
  }

  private endPan(event: PointerEvent): void {
    if (!this.panGesture || event.pointerId !== this.panGesture.pointerId) return;
    this.panGesture = null;
    this.dragging.set(false);
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(INTERACTIVE_TARGET_SELECTOR) !== null;
  }

  private centerVerticalOverflow(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTop = maxScrollTop < MIN_PAN_RANGE_PX ? 0 : Math.round(maxScrollTop / 2);
  }
}
