import { Component } from '@angular/core';
import { ProjectScreenComponent } from '../projects/project-screen/project-screen.component';

@Component({
  selector: 'app-homepage-integration-preview',
  imports: [ProjectScreenComponent],
  templateUrl: './homepage-integration-preview.component.html',
  styleUrl: './homepage-integration-preview.component.scss',
})
export class HomepageIntegrationPreviewComponent {}
