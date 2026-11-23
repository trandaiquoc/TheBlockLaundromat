import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { ProjectWorkflow } from '../../projects/project-workflow';
import { DioramaWasherPanelComponent } from './diorama-washer-panel.component';

afterEach(() => vi.restoreAllMocks());

describe('DioramaWasherPanelComponent', () => {
  it('ignores a stale revision preview, shows the current image, and revokes its URL on destroy', async () => {
    const first = deferred<Blob | undefined>();
    const second = deferred<Blob | undefined>();
    const projects = signal([project('project-1'), project('project-2')]);
    const selectedProjectId = signal<string | undefined>(undefined);
    const workflow = createWorkflow(projects, selectedProjectId);
    const previewService = {
      openPreview: vi.fn((id: string) => (id === 'project-1' ? first.promise : second.promise)),
    };
    TestBed.configureTestingModule({
      imports: [DioramaWasherPanelComponent],
      providers: [
        { provide: ProjectWorkflow, useValue: workflow },
        { provide: ProjectPreviewService, useValue: previewService },
      ],
    });
    TestBed.inject(I18nService).setLocale('en');
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:revision-two');
    const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(DioramaWasherPanelComponent);
    fixture.componentRef.setInput('active', true);
    fixture.componentRef.setInput('overlay', {
      preview: { x: 430, y: 250, visible: true },
      previewDiameter: 82,
      projectName: { x: 360, y: 120, width: 220, height: 46, visible: true },
    });

    selectedProjectId.set('project-1');
    fixture.detectChanges();
    await fixture.whenStable();
    selectedProjectId.set('project-2');
    fixture.detectChanges();
    await fixture.whenStable();
    first.resolve(new Blob(['stale'], { type: 'image/png' }));
    second.resolve(new Blob(['current'], { type: 'image/png' }));
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(previewService.openPreview).toHaveBeenNthCalledWith(
      1,
      'project-1',
      project('project-1').updatedAt,
    );
    expect(previewService.openPreview).toHaveBeenNthCalledWith(
      2,
      'project-2',
      project('project-2').updatedAt,
    );
    expect(createUrl).toHaveBeenCalledOnce();
    expect(root.querySelector('.washer-preview-portal img')?.getAttribute('src')).toBe(
      'blob:revision-two',
    );
    expect(root.querySelector('.washer-nameplate')?.textContent).toContain('Weekend Build');
    expect(root.querySelector('.washer-preview-portal')?.getAttribute('style')).toContain(
      'left: 430px',
    );
    expect(root.querySelector('.washer-preview-portal')?.getAttribute('style')).toContain(
      'width: 82px',
    );

    fixture.destroy();
    expect(revokeUrl).toHaveBeenCalledWith('blob:revision-two');
  });

  it('exposes missing and error preview states without retaining an old image', async () => {
    const projects = signal([project('project-1')]);
    const selectedProjectId = signal<string | undefined>('project-1');
    const workflow = createWorkflow(projects, selectedProjectId);
    const previewService = { openPreview: vi.fn(async () => undefined) };
    TestBed.configureTestingModule({
      imports: [DioramaWasherPanelComponent],
      providers: [
        { provide: ProjectWorkflow, useValue: workflow },
        { provide: ProjectPreviewService, useValue: previewService },
      ],
    });
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(DioramaWasherPanelComponent);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('.washer-panel__status')?.textContent).toContain(
        'No preview is available',
      );
    });

    previewService.openPreview.mockRejectedValueOnce(new Error('IndexedDB read failed'));
    projects.set([project('project-1', '2026-11-25T00:00:00.000Z')]);
    fixture.detectChanges();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(root.querySelector('[role="alert"]')).toBeTruthy();
    });
    fixture.destroy();
  });

  it('uses ProjectWorkflow for Open and confirmed Delete and offers a Board route when no project is selected', async () => {
    const projects = signal([project('project-1')]);
    const selectedProjectId = signal<string | undefined>('project-1');
    const workflow = createWorkflow(projects, selectedProjectId);
    TestBed.configureTestingModule({
      imports: [DioramaWasherPanelComponent],
      providers: [
        { provide: ProjectWorkflow, useValue: workflow },
        { provide: ProjectPreviewService, useValue: { openPreview: vi.fn(async () => undefined) } },
      ],
    });
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(DioramaWasherPanelComponent);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('.washer-panel__actions button:first-child') as HTMLButtonElement).click();
    (root.querySelector('.washer-panel__actions button:last-child') as HTMLButtonElement).click();
    expect(workflow.openProject).toHaveBeenCalledWith('project-1');
    expect(workflow.deleteProject).toHaveBeenCalledWith(project('project-1'));

    selectedProjectId.set(undefined);
    fixture.detectChanges();
    const boardRequested = vi.fn();
    fixture.componentInstance.boardRequested.subscribe(boardRequested);
    (root.querySelector('.washer-panel__empty button') as HTMLButtonElement).click();
    expect(boardRequested).toHaveBeenCalledOnce();
    fixture.destroy();
  });
});

function createWorkflow(
  projects: ReturnType<typeof signal<ProjectSummary[]>>,
  selectedProjectId: ReturnType<typeof signal<string | undefined>>,
) {
  return {
    projects,
    selectedProjectId,
    openingId: signal<string | undefined>(undefined),
    creating: signal(false),
    deletingProjectIds: signal<ReadonlySet<string>>(new Set()),
    deleteError: signal<string | undefined>(undefined),
    openProject: vi.fn(async () => undefined),
    deleteProject: vi.fn(async () => undefined),
  };
}

function project(id: string, updatedAt = '2026-11-24T00:00:00.000Z'): ProjectSummary {
  return {
    id,
    name: id === 'project-1' ? 'Laundry Plan' : 'Weekend Build',
    minecraftVersion: '1.21.1',
    size: { x: 16, y: 16, z: 16 },
    structureMode: 'vanilla-structure-block',
    updatedAt,
  };
}

function deferred<T>(): { readonly promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => (resolve = complete));
  return { promise, resolve };
}
