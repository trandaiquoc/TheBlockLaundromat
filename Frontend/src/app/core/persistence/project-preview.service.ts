import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { PROJECT_STORE } from './project-store/project-store.token';

export interface ProjectPreviewUpdate {
  readonly projectId: string;
  readonly updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectPreviewService {
  private readonly store = inject(PROJECT_STORE);
  private readonly updateSubject = new Subject<ProjectPreviewUpdate>();
  readonly updates = this.updateSubject.asObservable();

  async savePreview(projectId: string, updatedAt: string, preview: Blob): Promise<boolean> {
    const saved = await this.store.savePreview(projectId, updatedAt, preview);
    if (saved) this.updateSubject.next({ projectId, updatedAt });
    return saved;
  }
}
