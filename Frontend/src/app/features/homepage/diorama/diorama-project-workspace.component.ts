import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { DioramaTarget } from './diorama-contracts';
import type { DioramaWasherOverlayProjection } from './diorama-washer-overlay-projector';
import { DioramaProjectBoardPanelComponent } from './diorama-project-board-panel.component';
import { DioramaProjectPaperPanelComponent } from './diorama-project-paper-panel.component';
import { DioramaWasherPanelComponent } from './diorama-washer-panel.component';

const hiddenWasherOverlay: DioramaWasherOverlayProjection = {
  preview: { x: 0, y: 0, visible: false },
  previewDiameter: 0,
  projectName: { x: 0, y: 0, width: 0, height: 0, visible: false },
};

@Component({
  selector: 'app-diorama-project-workspace',
  imports: [
    DioramaProjectBoardPanelComponent,
    DioramaProjectPaperPanelComponent,
    DioramaWasherPanelComponent,
  ],
  templateUrl: './diorama-project-workspace.component.html',
  styleUrl: './diorama-project-workspace.component.scss',
})
export class DioramaProjectWorkspaceComponent {
  readonly focusedTarget = input<DioramaTarget | undefined>(undefined);
  readonly washerOverlay = input<DioramaWasherOverlayProjection>(hiddenWasherOverlay);
  readonly backRequested = output<void>();
  readonly targetRequested = output<DioramaTarget>();

  protected readonly manualPaperOpen = signal(false);
  protected readonly boardActive = computed(
    () => this.focusedTarget() === 'project-board' && !this.manualPaperOpen(),
  );
  protected readonly washerActive = computed(() => this.focusedTarget() === 'washer');
  protected readonly paperOpen = computed(
    () => this.manualPaperOpen() || this.focusedTarget() === 'courier',
  );
  private readonly host = viewChild<ElementRef<HTMLElement>>('workspaceRoot');
  private paperTrigger?: HTMLButtonElement;

  focusPanel(target: DioramaTarget): void {
    const panel = target === 'courier' ? 'courier-paper' : target;
    queueMicrotask(() =>
      this.host()
        ?.nativeElement.querySelector<HTMLElement>(`[data-spatial-panel="${panel}"] h2`)
        ?.focus({ preventScroll: true }),
    );
  }

  protected openPaperFromBoard(trigger: HTMLButtonElement): void {
    this.paperTrigger = trigger;
    this.manualPaperOpen.set(true);
  }

  protected closePaper(): void {
    if (this.manualPaperOpen()) {
      this.manualPaperOpen.set(false);
      queueMicrotask(() => this.paperTrigger?.focus({ preventScroll: true }));
      return;
    }
    this.backRequested.emit();
  }
}
