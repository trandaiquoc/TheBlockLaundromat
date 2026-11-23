import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { MojangVersionService } from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ProjectBackupWorkflow } from '../../projects/project-backup-workflow';
import { ProjectUtilitiesComponent } from '../../projects/project-utilities.component';
import { ProjectWorkflow } from '../../projects/project-workflow';
import { DioramaProjectProjectionBridge } from './diorama-project-projection-bridge';
import type {
  DioramaProjectProjection,
  DioramaProjectSurface,
} from './diorama-project-anchor-projector';
import { DioramaProjectWorkspaceComponent } from './diorama-project-workspace.component';

describe('DioramaProjectWorkspaceComponent', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps projected project notes searchable, paginated, selectable, and tied to the washer', async () => {
    const fixtureState = createFixture();
    const { fixture, bridge, workflow, previewService } = fixtureState;
    await fixture.whenStable();
    bridge.publish(createProjection());
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.diorama-project-workspace__board')?.hasAttribute('hidden')).toBe(
      false,
    );
    expect(root.querySelector('.diorama-project-workspace__board')?.getAttribute('style')).toContain(
      'matrix3d(',
    );
    expect(root.querySelectorAll('.project-note')).toHaveLength(4);

    const nextPage = root.querySelector(
      'button[aria-label="Next project notes page"]',
    ) as HTMLButtonElement;
    nextPage.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.project-note')).toHaveLength(2);
    expect(root.querySelector('.project-note strong')?.textContent?.trim()).toBe('Project 2');

    const search = root.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'Project 1';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelectorAll('.project-note')).toHaveLength(1);
    (root.querySelector('.project-note__select') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const selected = fixtureState.projects[0];
    expect(workflow.selectProject).toHaveBeenCalledWith(selected.id);
    expect(previewService.openPreview).toHaveBeenCalledWith(selected.id, selected.updatedAt);
    expect(
      root.querySelector('.diorama-project-workspace__washer-open')?.hasAttribute('hidden'),
    ).toBe(false);
    expect(
      root.querySelector('.diorama-project-workspace__washer-delete')?.hasAttribute('hidden'),
    ).toBe(false);
    fixture.destroy();
  });

  it('randomizes sticky note colors after each successful project load', async () => {
    let randomValue = 0;
    const random = vi.spyOn(Math, 'random').mockImplementation(() => randomValue);
    const { fixture, workflow } = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const colors = (): string[] =>
      Array.from(root.querySelectorAll('.project-note')).map(
        (note) => (note as HTMLElement).dataset['noteColor'] ?? '',
      );
    const firstLoadColors = colors();
    expect(new Set(firstLoadColors).size).toBe(4);

    workflow.loadStatus.set('loading');
    fixture.detectChanges();
    randomValue = 0.99;
    workflow.loadStatus.set('ready');
    fixture.detectChanges();
    const secondLoadColors = colors();
    expect(new Set(secondLoadColors).size).toBe(4);
    expect(secondLoadColors).not.toEqual(firstLoadColors);
    random.mockRestore();
    fixture.destroy();
  });

  it('ignores stale preview requests and revokes the selected image URL on unmount', async () => {
    const firstPreview = deferred<Blob | undefined>();
    const secondPreview = deferred<Blob | undefined>();
    const { fixture, workflow, previewService } = createFixture();
    previewService.openPreview.mockImplementation((projectId: string) =>
      projectId === 'project-1' ? firstPreview.promise : secondPreview.promise,
    );
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:project-two-preview');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    workflow.selectProject('project-1');
    fixture.detectChanges();
    workflow.selectProject('project-2');
    fixture.detectChanges();
    firstPreview.resolve(new Blob(['stale preview'], { type: 'image/png' }));
    secondPreview.resolve(new Blob(['current preview'], { type: 'image/png' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.diorama-project-workspace__washer-preview img')?.src)
      .toBe('blob:project-two-preview');
    expect(revokeObjectUrl).not.toHaveBeenCalled();

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:project-two-preview');
  });

  it('shows a localized error state when the selected preview cannot be read', async () => {
    const { fixture, workflow, previewService } = createFixture();
    previewService.openPreview.mockRejectedValueOnce(new Error('IndexedDB read failed'));
    workflow.selectProject('project-1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.diorama-project-workspace__preview-error',
      ),
    ).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeTruthy();
    fixture.destroy();
  });

  it('opens Courier creation with Create and Import options and preserves the shared form', async () => {
    const { fixture, bridge, workflow } = createFixture();
    await fixture.whenStable();
    bridge.publish(createProjection());
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('.diorama-project-workspace__courier-note') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('[role="dialog"]')).toBeTruthy();
    const createTab = root.querySelector('[data-project-tab="create"]') as HTMLButtonElement;
    const importTab = root.querySelector('[data-project-tab="import"]') as HTMLButtonElement;
    expect(createTab.getAttribute('aria-selected')).toBe('true');
    expect(importTab.getAttribute('aria-selected')).toBe('false');
    importTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(importTab.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(importTab);
    expect(root.querySelector('#diorama-project-import-panel')).toBeTruthy();
    createTab.click();
    fixture.detectChanges();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(workflow.createProject).toHaveBeenCalledWith({
      name: 'Untitled structure',
      minecraftVersion: '1.21.1',
      size: { x: 16, y: 16, z: 16 },
      structureMode: 'vanilla-structure-block',
    });
    expect(root.querySelector('[role="dialog"]')).toBeNull();
    fixture.destroy();
  });
});

function createFixture(): {
  readonly fixture: ReturnType<typeof TestBed.createComponent<DioramaProjectWorkspaceComponent>>;
  readonly bridge: DioramaProjectProjectionBridge;
  readonly workflow: ReturnType<typeof createWorkflow>;
  readonly previewService: { openPreview: ReturnType<typeof vi.fn> };
  readonly projects: ReturnType<typeof createProjects>;
} {
  const projects = createProjects();
  const workflow = createWorkflow(projects);
  const bridge = new DioramaProjectProjectionBridge();
  const previewService = { openPreview: vi.fn(async () => undefined) };
  TestBed.configureTestingModule({
    imports: [DioramaProjectWorkspaceComponent],
    providers: [
      { provide: ProjectWorkflow, useValue: workflow },
      { provide: ProjectPreviewService, useValue: previewService },
      {
        provide: MojangVersionService,
        useValue: { releases: signal([]), loadReleases: vi.fn(async () => []) },
      },
      { provide: DioramaProjectProjectionBridge, useValue: bridge },
    ],
  });
  TestBed.overrideComponent(ProjectUtilitiesComponent, {
    set: {
      template: '',
      providers: [
        { provide: ProjectBackupWorkflow, useValue: {} },
        { provide: BlockLibraryService, useValue: {} },
      ],
    },
  });
  const i18n = TestBed.inject(I18nService);
  i18n.setLocale('en');
  const fixture = TestBed.createComponent(DioramaProjectWorkspaceComponent);
  fixture.detectChanges();
  return { fixture, bridge, workflow, previewService, projects };
}

function createWorkflow(projects: ReturnType<typeof createProjects>) {
  const selectedProjectId = signal<string | undefined>(undefined);
  return {
    projects: signal(projects),
    selectedProjectId,
    loadStatus: signal<'loading' | 'ready' | 'error'>('ready'),
    openingId: signal<string | undefined>(undefined),
    creating: signal(false),
    deletingProjectIds: signal<ReadonlySet<string>>(new Set()),
    deleteError: signal<string | undefined>(undefined),
    error: signal<string | undefined>(undefined),
    loadProjects: vi.fn(async () => undefined),
    selectProject: vi.fn((id: string | undefined) => selectedProjectId.set(id)),
    openProject: vi.fn(async () => undefined),
    deleteProject: vi.fn(async () => undefined),
    createProject: vi.fn(async () => true),
    createImportedProject: vi.fn(async () => undefined),
    activateImportedProject: vi.fn(async () => undefined),
    clearError: vi.fn(),
  };
}

function createProjects() {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `project-${index + 1}`,
    name: `Project ${index + 1}`,
    minecraftVersion: '1.21.1',
    size: { x: 16, y: 16, z: 16 },
    structureMode: 'vanilla-structure-block' as const,
    updatedAt: `2026-11-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
}

function createProjection(): DioramaProjectProjection {
  const point = (x: number, y: number) => ({ x, y, visible: true });
  const surface = (x: number, y: number, width: number, height: number): DioramaProjectSurface => ({
    topLeft: point(x, y),
    topRight: point(x + width, y),
    bottomRight: point(x + width, y + height),
    bottomLeft: point(x, y + height),
    layoutWidth: width,
    layoutHeight: height,
    visible: true,
  });
  return {
    board: {
      topLeft: point(100, 100),
      topRight: point(400, 80),
      bottomRight: point(430, 380),
      bottomLeft: point(80, 390),
      layoutWidth: 720,
      layoutHeight: 680,
      visible: true,
    },
    washer: {
      preview: surface(650, 250, 100, 100),
      open: surface(760, 410, 40, 30),
      delete: surface(820, 410, 40, 30),
      projectName: surface(730, 470, 220, 20),
      visible: true,
    },
    courierNote: surface(930, 420, 60, 48),
  };
}

function deferred<T>(): { readonly promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}
