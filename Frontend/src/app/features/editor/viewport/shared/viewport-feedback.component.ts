import { Component, inject, input } from '@angular/core';
import type { PlacementStatus } from '../../../../core/editor/placement/placement';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import type { VoxelCoordinate } from '../../../../core/domain/voxel-coordinate.types';

@Component({
  selector: 'app-viewport-feedback',
  templateUrl: './viewport-feedback.component.html',
  styleUrl: './viewport-feedback.component.scss',
})
export class ViewportFeedbackComponent {
  readonly placementStatus = input<PlacementStatus>();
  readonly placementReason = input('');
  readonly target = input<VoxelCoordinate>();

  protected readonly i18n = inject(I18nService);
}
