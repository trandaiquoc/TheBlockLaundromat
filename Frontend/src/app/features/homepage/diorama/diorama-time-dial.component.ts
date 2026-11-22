import { Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import {
  dioramaTimeStageIndexAtProgress,
  dioramaTimeStages,
  nearestDioramaTimeProgress,
} from './diorama-time-stages';

export interface DioramaTimeDialChange {
  readonly index: number;
  readonly progress: number;
  readonly isDragging: boolean;
}

@Component({
  selector: 'app-diorama-time-dial',
  templateUrl: './diorama-time-dial.component.html',
  styleUrl: './diorama-time-dial.component.scss',
})
export class DioramaTimeDialComponent {
  protected readonly i18n = inject(I18nService);
  readonly selectedIndex = input.required<number>();
  readonly cycleProgress = input.required<number>();
  readonly timeChanged = output<DioramaTimeDialChange>();
  protected readonly timeStages = dioramaTimeStages;
  protected readonly selectedStage = computed(() => this.timeStages[this.selectedIndex()]);

  private activePointerId?: number;
  private lastPointerAngle = 0;
  private dragProgress = 0;

  protected beginRotation(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button')) return;

    const dial = event.currentTarget as HTMLElement;
    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.lastPointerAngle = pointerAngle(event, dial);
    this.dragProgress = nearestEquivalentProgress(
      this.cycleProgress(),
      this.lastPointerAngle / (Math.PI / 2),
    );
    dial.setPointerCapture(event.pointerId);
    this.emitChange(true);
  }

  protected continueRotation(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    const angle = pointerAngle(event, event.currentTarget as HTMLElement);
    const angleDelta = Math.atan2(
      Math.sin(angle - this.lastPointerAngle),
      Math.cos(angle - this.lastPointerAngle),
    );
    this.dragProgress += angleDelta / (Math.PI / 2);
    this.lastPointerAngle = angle;
    this.emitChange(true);
  }

  protected finishRotation(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return;
    const dial = event.currentTarget as HTMLElement;
    this.activePointerId = undefined;
    if (dial.hasPointerCapture(event.pointerId)) dial.releasePointerCapture(event.pointerId);
    this.emitChange(false);
  }

  protected selectTimeStage(index: number): void {
    this.dragProgress = nearestDioramaTimeProgress(this.cycleProgress(), index);
    this.emitChange(false);
  }

  protected updateFromSlider(event: Event): void {
    const index = Number((event.currentTarget as HTMLInputElement).value);
    this.dragProgress = nearestDioramaTimeProgress(this.cycleProgress(), index);
    this.emitChange(false);
  }

  private emitChange(isDragging: boolean): void {
    this.timeChanged.emit({
      index: dioramaTimeStageIndexAtProgress(this.dragProgress),
      progress: this.dragProgress,
      isDragging,
    });
  }
}

function pointerAngle(event: PointerEvent, dial: HTMLElement): number {
  const bounds = dial.getBoundingClientRect();
  const x = event.clientX - bounds.left - bounds.width / 2;
  const y = event.clientY - bounds.top - bounds.height / 2;
  const angle = Math.atan2(x, -y);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function nearestEquivalentProgress(currentProgress: number, pointerProgress: number): number {
  const cycleLength = dioramaTimeStages.length;
  const turns = Math.round((currentProgress - pointerProgress) / cycleLength);
  return pointerProgress + turns * cycleLength;
}
