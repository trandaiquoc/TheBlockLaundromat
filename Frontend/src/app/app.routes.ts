import { Routes } from '@angular/router';
import { editorCanDeactivate } from './core/persistence/editor-leave-coordinator.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/homepage/homepage.component').then(
        ({ HomepageComponent }) => HomepageComponent,
      ),
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./features/editor/shell/editor-shell.component').then(
        ({ EditorShellComponent }) => EditorShellComponent,
      ),
    canDeactivate: [editorCanDeactivate],
  },
  { path: '**', redirectTo: '' },
];
