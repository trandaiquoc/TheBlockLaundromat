import { Component, output } from '@angular/core';
import { ProjectScreenAccountComponent } from '../projects/project-screen/project-screen-account.component';

@Component({
  selector: 'app-mini-diorama-preview-account',
  imports: [ProjectScreenAccountComponent],
  template:
    '<app-project-screen-account [compact]="true" (settingsRequested)="settingsRequested.emit()" />',
  styleUrl: './mini-diorama-preview-account.component.scss',
})
export class MiniDioramaPreviewAccountComponent {
  readonly settingsRequested = output<void>();
}
