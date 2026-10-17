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
import { ProjectScreenWorkflow } from '../../features/projects/project-screen/project-screen-workflow';
import { ProjectScreenPreviewComponent } from '../../features/projects/project-screen/project-screen-preview.component';

const baseProject: ProjectDocument = {
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

class ManualIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '160px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];
  readonly observed = new Set<Element>();
  readonly observe = vi.fn((element: Element) => this.observed.add(element));
  readonly unobserve = vi.fn((element: Element) => this.observed.delete(element));
  readonly disconnect = vi.fn(() => this.observed.clear());
  private static current?: ManualIntersectionObserver;

  constructor(private readonly callback: IntersectionObserverCallback) {
    ManualIntersectionObserver.current = this;
  }

  static intersect(element: Element): void {
    this.current?.callback(
      [{ target: element, isIntersecting: true } as IntersectionObserverEntry],
      this.current,
    );
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

async function createIndexedDbBlob(content: string): Promise<Blob> {
  const moduleName = ['node', 'buffer'].join(':');
  const bufferModule = (await import(moduleName)) as { Blob: typeof Blob };
  return new bufferModule.Blob([content], { type: 'image/webp' });
}

describe('project preview navigation integration', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('refreshes loaded Homepage cards after non-blocking capture commits and rejects deleted projects', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('IntersectionObserver', ManualIntersectionObserver);
    const first = baseProject;
    const second: ProjectDocument = {
      ...baseProject,
      id: 'preview-flow-second',
      metadata: { ...baseProject.metadata, name: 'Preview flow second' },
    };
    const store = new IndexedDbProjectStore('preview-flow-navigation');
    await store.create(first);
    await store.create(second);
    const loads = vi.fn((id: string, updatedAt: string) => store.openPreview(id, updatedAt));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:captured-preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [ProjectScreenPreviewComponent],
      providers: [
        { provide: PROJECT_STORE, useValue: store },
        { provide: ProjectScreenWorkflow, useValue: { loadProjectPreview: loads } },
        { provide: ProjectAutosaveService, useValue: { isUnsafeDirty: false, flush: vi.fn() } },
        { provide: AssetActivityService, useValue: { hasProtectedOperation: () => false } },
        { provide: DialogService, useValue: { confirm: vi.fn() } },
        { provide: I18nService, useValue: { t: (key: string) => key } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const coordinator = TestBed.inject(EditorLeaveCoordinator);
    const previews = TestBed.inject(ProjectPreviewService);
    const firstFixture = TestBed.createComponent(ProjectScreenPreviewComponent);
    firstFixture.componentRef.setInput('project', {
      id: first.id,
      updatedAt: first.metadata.updatedAt,
    });
    firstFixture.detectChanges();
    const secondFixture = TestBed.createComponent(ProjectScreenPreviewComponent);
    secondFixture.componentRef.setInput('project', {
      id: second.id,
      updatedAt: second.metadata.updatedAt,
    });
    secondFixture.detectChanges();

    let finishCapture!: (preview: Blob) => void;
    const captureCompletion = new Promise<Blob>((resolve) => (finishCapture = resolve));
    let finishSave!: () => void;
    const saveCompletion = new Promise<void>((resolve) => (finishSave = resolve));
    coordinator.registerProjectPreviewCapture(async () => {
      const preview = await captureCompletion;
      await previews.savePreview(first.id, first.metadata.updatedAt, preview);
      finishSave();
    });

    expect(await coordinator.canLeave()).toBe(true);
    ManualIntersectionObserver.intersect(firstFixture.nativeElement as Element);
    ManualIntersectionObserver.intersect(secondFixture.nativeElement as Element);
    await Promise.all([firstFixture.whenStable(), secondFixture.whenStable()]);
    firstFixture.detectChanges();
    secondFixture.detectChanges();
    expect(loads.mock.calls.map(([id]) => id)).toEqual([first.id, second.id]);
    expect(firstFixture.nativeElement.querySelector('img')).toBeNull();

    const firstPreview = await createIndexedDbBlob('first project capture');
    finishCapture(firstPreview);
    await saveCompletion;
    await Promise.all([firstFixture.whenStable(), secondFixture.whenStable()]);
    await Promise.all(loads.mock.results.map(({ value }) => value as Promise<Blob | undefined>));
    await Promise.resolve();
    firstFixture.detectChanges();
    secondFixture.detectChanges();

    expect(loads.mock.calls.map(([id]) => id)).toEqual([first.id, second.id, first.id]);
    expect(firstFixture.nativeElement.querySelector('img')).not.toBeNull();
    expect(secondFixture.nativeElement.querySelector('img')).toBeNull();

    await store.delete(second.id);
    expect(await previews.savePreview(second.id, second.metadata.updatedAt, firstPreview)).toBe(
      false,
    );
    await secondFixture.whenStable();
    expect(loads.mock.calls.map(([id]) => id)).toEqual([first.id, second.id, first.id]);

    firstFixture.destroy();
    secondFixture.destroy();
    expect(await store.openPreview(first.id, first.metadata.updatedAt)).toBeDefined();
    expect(await store.openPreview(second.id, second.metadata.updatedAt)).toBeUndefined();
  });
});
