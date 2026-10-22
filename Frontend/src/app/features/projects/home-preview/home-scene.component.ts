import {
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ThemeService } from '../../../core/ui/theme/theme.service';
import { HomeSceneView, type HomeBoardRect } from './home-scene-view';

@Component({
  selector: 'app-home-scene',
  template: `
    <canvas #canvas aria-hidden="true" (pointermove)="inspectPointer($event)"></canvas>
    @if (sceneError()) {
      <p role="alert">{{ i18n.t('homePreviewUnavailable') }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    }
    p {
      position: absolute;
      left: 1rem;
      bottom: 5rem;
      padding: 0.6rem;
      background: #241b19;
      color: white;
    }
  `,
})
export class HomeSceneComponent {
  readonly boardLayout = output<HomeBoardRect>();
  private readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly sceneError = signal(false);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private view?: HomeSceneView;

  constructor() {
    afterNextRender(() => {
      try {
        this.view = new HomeSceneView(this.canvas().nativeElement, (rect) =>
          this.boardLayout.emit(rect),
        );
        void this.loadTheme(this.theme.theme());
      } catch (error) {
        this.sceneError.set(true);
        this.errorHandler.handleError(error);
      }
      this.destroyRef.onDestroy(() => this.view?.dispose());
    });
    effect(() => {
      const theme = this.theme.theme();
      if (this.view) void this.loadTheme(theme);
    });
  }

  protected inspectPointer(event: PointerEvent): void {
    const hit = this.view?.hitTest(event.clientX, event.clientY);
    this.canvas().nativeElement.dataset['hit'] = hit ?? '';
  }

  private async loadTheme(theme: ReturnType<ThemeService['theme']>): Promise<void> {
    try {
      await this.view?.setTheme(theme);
      this.sceneError.set(false);
    } catch (error) {
      this.sceneError.set(true);
      this.errorHandler.handleError(error);
    }
  }
}
