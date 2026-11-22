interface ActiveThemeSwipe {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  currentX: number;
  consumed: boolean;
}

/** Owns the overview swipe gesture and its pointer-listener lifetime. */
export class DioramaThemeSwipeInput {
  private activeSwipe?: ActiveThemeSwipe;
  private cancellingCanvasPointerId?: number;
  private suppressClickUntil = 0;
  private readonly window: Window;

  constructor(
    private readonly host: HTMLElement,
    private readonly onSwipe: (direction: -1 | 1) => void,
  ) {
    const window = host.ownerDocument.defaultView;
    if (!window) throw new Error('The Diorama page requires a browser window.');
    this.window = window;
    host.addEventListener('pointerdown', this.onPointerDown, true);
    host.addEventListener('pointermove', this.onPointerMove, true);
    host.addEventListener('pointerup', this.onPointerUp, true);
    host.addEventListener('pointercancel', this.onPointerCancel, true);
    host.addEventListener('click', this.onClick, true);
  }

  dispose(): void {
    this.activeSwipe = undefined;
    this.host.removeEventListener('pointerdown', this.onPointerDown, true);
    this.host.removeEventListener('pointermove', this.onPointerMove, true);
    this.host.removeEventListener('pointerup', this.onPointerUp, true);
    this.host.removeEventListener('pointercancel', this.onPointerCancel, true);
    this.host.removeEventListener('click', this.onClick, true);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!this.isOverviewFocused()) return;
    if (
      event.target instanceof Element &&
      event.target.closest('button, input, select, textarea, [role="dialog"], .diorama-time-dial')
    ) {
      return;
    }
    this.activeSwipe = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      consumed: false,
    };
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const swipe = this.activeSwipe;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    swipe.currentX = event.clientX;
    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    const threshold = Math.max(68, this.window.innerWidth * 0.12);
    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    swipe.consumed = true;
    event.preventDefault();
    event.stopPropagation();
    const canvas = this.host.querySelector('canvas');
    if (!canvas) return;
    this.cancellingCanvasPointerId = event.pointerId;
    canvas.dispatchEvent(
      new PointerEvent('pointercancel', {
        bubbles: true,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
        button: event.button,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );
    this.cancellingCanvasPointerId = undefined;
  };

  private readonly onPointerUp = (event: PointerEvent): void => this.finish(event, true);
  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.cancellingCanvasPointerId !== event.pointerId) this.finish(event, false);
  };
  private readonly onClick = (event: MouseEvent): void => {
    if (this.window.performance.now() > this.suppressClickUntil) return;
    this.suppressClickUntil = 0;
    event.preventDefault();
    event.stopPropagation();
  };

  private finish(event: PointerEvent, commit: boolean): void {
    const swipe = this.activeSwipe;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    this.activeSwipe = undefined;
    if (!swipe.consumed) return;
    event.preventDefault();
    event.stopPropagation();
    if (!commit) return;
    const direction = swipe.currentX < swipe.startX ? 1 : -1;
    this.suppressClickUntil = this.window.performance.now() + 250;
    this.onSwipe(direction);
  }

  private isOverviewFocused(): boolean {
    return (
      this.host.querySelector('[data-focus-target="overview"]')?.getAttribute('aria-pressed') ===
      'true'
    );
  }
}
