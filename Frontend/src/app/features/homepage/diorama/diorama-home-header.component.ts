import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/ui/localization/i18n.service';

@Component({
  selector: 'app-diorama-home-header',
  imports: [NgOptimizedImage],
  templateUrl: './diorama-home-header.component.html',
  styleUrl: './diorama-home-header.component.scss',
})
export class DioramaHomeHeaderComponent {
  protected readonly i18n = inject(I18nService);
}
