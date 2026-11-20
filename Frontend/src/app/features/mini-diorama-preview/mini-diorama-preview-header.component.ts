import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/ui/localization/i18n.service';

@Component({
  selector: 'app-mini-diorama-preview-header',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './mini-diorama-preview-header.component.html',
  styleUrl: './mini-diorama-preview-header.component.scss',
})
export class MiniDioramaPreviewHeaderComponent {
  protected readonly i18n = inject(I18nService);
}
