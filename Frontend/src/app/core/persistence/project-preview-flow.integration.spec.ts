import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectDocument } from '../domain/project.types';
import { PROJECT_STORE } from './project-store/project-store.token';
import { IndexedDbProjectStore } from './project-store/indexeddb-project-store';
import { ProjectPreviewService } from './project-preview.service';
import { EditorLeaveCoordinator } from './editor-leave-coordinator.service';
import { ProjectAutosaveService } from './autosave/project-autosave.service';
import { AssetActivityService } from '../assets/asset-activity.service';
import { DialogService } from '../ui/dialog/dialog.service';
import { I18nService } from '../ui/localization/i18n.service';

const project: ProjectDocument = {
  schemaVersion: 3,
  id: 'preview-flow-first',
  metadata: {
    name: 'Preview flow first',
    minecraftVersion: '1.21.1',
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  },
  size: { x: 4, y: 4, z: 4 },
  structureMode: 'vanilla-structure-block',
  blocks: [],
  groups: [],
  decorations: [],
  editorSettings: { currentY: 0, layerVisibility: 'current-only', referenceLayerOpacity: 0.5 },
};

describe('project preview persistence integration', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('commits a capture asynchronously after navigation and rejects a deleted project', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    const store = new IndexedDbProjectStore('preview-flow-navigation');
    await store.create(project);

    await TestBed.configureTestingModule({
      providers: [
        { provide: PROJECT_STORE, useValue: store },
        { provide: ProjectAutosaveService, useValue: { isUnsafeDirty: false, flush: vi.fn() } },
        { provide: AssetActivityService, useValue: { hasProtectedOperation: () => false } },
        { provide: DialogService, useValue: { confirm: vi.fn() } },
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const coordinator = TestBed.inject(EditorLeaveCoordinator);
    const previews = TestBed.inject(ProjectPreviewService);
    let finishCapture!: (preview: Blob) => void;
    const captureCompletion = new Promise<Blob>((resolve) => (finishCapture = resolve));
    let finishSave!: () => void;
    const saveCompletion = new Promise<void>((resolve) => (finishSave = resolve));
    coordinator.registerProjectPreviewCapture(async () => {
      const preview = await captureCompletion;
      await previews.savePreview(project.id, project.metadata.updatedAt, preview);
      finishSave();
    });

    expect(await coordinator.canLeave()).toBe(true);
    const image = new Blob(['captured project preview'], { type: 'image/webp' });
    finishCapture(image);
    await saveCompletion;
    expect(await store.openPreview(project.id, project.metadata.updatedAt)).toBeDefined();

    await store.delete(project.id);
    expect(await previews.savePreview(project.id, project.metadata.updatedAt, image)).toBe(false);
    expect(await store.openPreview(project.id, project.metadata.updatedAt)).toBeUndefined();
  });
});
