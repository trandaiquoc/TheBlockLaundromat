import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectStore } from './project-store/project-store.port';
import { PROJECT_STORE } from './project-store/project-store.token';
import { ProjectPreviewService } from './project-preview.service';

describe('ProjectPreviewService', () => {
  it('reads only the expected project revision through ProjectStore', async () => {
    const preview = new Blob(['revision preview'], { type: 'image/png' });
    const store = {
      openPreview: vi.fn(async () => preview),
    } as unknown as ProjectStore;
    TestBed.configureTestingModule({
      providers: [ProjectPreviewService, { provide: PROJECT_STORE, useValue: store }],
    });

    await expect(TestBed.inject(ProjectPreviewService).openPreview('project-a', 'revision-4')).resolves.toBe(
      preview,
    );
    expect(store.openPreview).toHaveBeenCalledWith('project-a', 'revision-4');
  });
});
