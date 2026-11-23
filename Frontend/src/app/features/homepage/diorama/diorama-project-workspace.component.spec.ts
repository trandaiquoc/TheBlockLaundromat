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
import { DioramaProjectWorkspaceComponent } from './diorama-project-workspace.component';

afterEach(() => vi.restoreAllMocks());

describe('DioramaProjectWorkspaceComponent', () => {
  it('shows the screen-space board only after focus and routes a real project selection to Washer', async () => {
    const { fixture, workflow, projects } = createFixture();
    const targetRequested = vi.fn();
    fixture.componentInstance.targetRequested.subscribe(targetRequested);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-spatial-panel="project-board"]')?.hasAttribute('hidden')).toBe(
      true,
    );
    fixture.componentRef.setInput('focusedTarget', 'project-board');
    fixture.detectChanges();
    expect(root.querySelector('[data-spatial-panel="project-board"]')?.hasAttribute('hidden')).toBe(
      false,
    );
    expect(
      root.querySelector('[data-spatial-panel="project-board"]')?.getAttribute('style'),
    ).toBeNull();

    (root.querySelector('.project-note__select') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(workflow.selectProject).toHaveBeenCalledWith(projects[5].id);
    expect(targetRequested).toHaveBeenCalledWith('washer');

    fixture.componentRef.setInput('focusedTarget', 'washer');
    fixture.detectChanges();
    expect(root.querySelector('[data-spatial-panel="project-board"]')?.hasAttribute('hidden')).toBe(
      true,
    );
    expect(root.querySelector('[data-spatial-panel="washer"]')?.hasAttribute('hidden')).toBe(false);
    expect(root.querySelector('.washer-panel__heading')?.textContent?.trim()).toBe(
      projects[5].name,
    );
    fixture.destroy();
  });

  it('opens the Courier paper panel on focus and returns through the shared navigation output', () => {
    const { fixture } = createFixture();
    const backRequested = vi.fn();
    fixture.componentInstance.backRequested.subscribe(backRequested);
    fixture.componentRef.setInput('focusedTarget', 'courier');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.paper-backdrop')?.hasAttribute('hidden')).toBe(false);
    (root.querySelector('.paper-panel__header button') as HTMLButtonElement).click();
    expect(backRequested).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('focusedTarget', undefined);
    fixture.detectChanges();
    expect(root.querySelector('.paper-backdrop')?.hasAttribute('hidden')).toBe(true);
    fixture.destroy();
  });

  it('returns from a Board paper form to Board and restores focus to its trigger', async () => {
    const { fixture } = createFixture();
    fixture.componentRef.setInput('focusedTarget', 'project-board');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector('.board-panel__create') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(root.querySelector('[data-spatial-panel="courier-paper"]')?.hasAttribute('hidden')).toBe(
      false,
    );
    (root.querySelector('.paper-panel__header button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[data-spatial-panel="project-board"]')?.hasAttribute('hidden')).toBe(
      false,
    );
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });
});

function createFixture() {
  const projects = Array.from({ length: 6 }, (_, index) => ({
    id: `project-${index + 1}`,
    name: `Project ${index + 1}`,
    minecraftVersion: '1.21.1',
    size: { x: 16, y: 16, z: 16 },
    structureMode: 'vanilla-structure-block' as const,
    updatedAt: `2026-11-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
  const selectedProjectId = signal<string | undefined>(undefined);
  const workflow = {
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
  TestBed.configureTestingModule({
    imports: [DioramaProjectWorkspaceComponent],
    providers: [
      { provide: ProjectWorkflow, useValue: workflow },
      { provide: ProjectPreviewService, useValue: { openPreview: vi.fn(async () => undefined) } },
      {
        provide: MojangVersionService,
        useValue: { releases: signal([]), loadReleases: vi.fn(async () => []) },
      },
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
  TestBed.inject(I18nService).setLocale('en');
  const fixture = TestBed.createComponent(DioramaProjectWorkspaceComponent);
  fixture.detectChanges();
  return { fixture, workflow, projects };
}
