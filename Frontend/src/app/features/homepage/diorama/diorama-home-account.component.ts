import { Component, output } from '@angular/core';
import { ProjectScreenAccountComponent } from '../../projects/project-screen/project-screen-account.component';

@Component({
  selector: 'app-diorama-home-account',
  imports: [ProjectScreenAccountComponent],
  template:
    '<app-project-screen-account [compact]="true" (settingsRequested)="settingsRequested.emit()" />',
  styleUrl: './diorama-home-account.component.scss',
})
export class DioramaHomeAccountComponent {
  readonly settingsRequested = output<void>();
}
