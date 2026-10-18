// @ts-expect-error Vitest checks this template contract in Node.
import { readFileSync } from 'node:fs';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectDocument } from '../../../core/domain/project.types';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { MojangVersionService } from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ProjectScreenComponent } from './project-screen.component';
import { ProjectScreenWorkflow } from './project-screen-workflow';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';

describe('ProjectScreenComponent', () => {
  it('marks the project name input as the create dialog initial focus target', () => {
    const template = String(
      readFileSync(
        'src/app/features/projects/project-screen/project-screen.component.html',
        'utf8',
      ),
    );

    expect(template).toMatch(/<input\s+cdkFocusInitial\s+class="project-text-input"/);
  });

  it('marks the structure import heading as the initial focus target', () => {
    const template = String(
      readFileSync(
        'src/app/features/projects/project-screen/project-screen.component.html',
        'utf8',
      ),
    );

    expect(template).toMatch(/<h2\s+cdkFocusInitial\s+tabindex="-1"/);
  });

  it('composes the page from layered theme artwork and real project data', () => {
    const template = String(
      readFileSync(
        'src/app/features/projects/project-screen/project-screen.component.html',
        'utf8',
      ),
    );
    const sceneTemplate = String(
      readFileSync(
        'src/app/features/projects/project-screen/scene/project-screen-scene.component.html',
        'utf8',
      ),
    );

    expect(template).toContain('<app-project-screen-scene');
    expect(template).toContain('[project]="project"');
    expect(template).toContain('class="project-note"');
    expect(template).toContain('class="project-note-meta"');
    expect(template).toContain("i18n.t('minecraftJavaVersion')");
    expect(template).toContain("i18n.t('structureSize')");
    expect(template).toContain('class="washer-actions"');
    expect(sceneTemplate).toContain('[ngSrc]="scene().background.src"');
    expect(sceneTemplate).toContain('class="scene-layer--exterior"');
    expect(sceneTemplate).toContain('scene-layer--wall-sign');
    expect(sceneTemplate).toContain('scene-layer--washer');
    expect(sceneTemplate).toContain('scene-layer--board');
    expect(sceneTemplate).toContain('scene-layer--washer-mascot');
    expect(sceneTemplate).toContain('scene-layer--map-mascot');
    expect(sceneTemplate).toContain('class="scene-layer--foreground"');
  });

  it('keeps the official logo as a separate scene overlay', () => {
    const sceneTemplate = String(
      readFileSync(
        'src/app/features/projects/project-screen/scene/project-screen-scene.component.html',
        'utf8',
      ),
    );

    expect(sceneTemplate).toContain('class="scene-layer--wall-sign"');
    expect(sceneTemplate).toContain('assets/brand/the-block-laundromat-logo.svg');
  });

  it('delegates imported project activation to the screen workflow', async () => {
    const project = { id: 'imported' } as ProjectDocument;
    const createProject = vi.fn(async () => project);
    const activateImportedProject = vi.fn(async () => undefined);
    const component = Object.create(ProjectScreenComponent.prototype) as ProjectScreenComponent;
    const state = component as unknown as Record<string, unknown>;
    state['structureJsonImport'] = { createProject };
    state['workflow'] = { activateImportedProject };

    await (
      component as unknown as { createProjectFromStructureJson(): Promise<void> }
    ).createProjectFromStructureJson();

    expect(createProject).toHaveBeenCalledOnce();
    expect(activateImportedProject).toHaveBeenCalledWith(project);
  });

  it('filters and sorts the project cards through the board controls', async () => {
    const projects: readonly ProjectSummary[] = [
      {
        id: 'cabin',
        name: 'Lakeside Cabin',
        minecraftVersion: '1.21.1',
        size: { x: 16, y: 16, z: 16 },
        structureMode: 'vanilla-structure-block',
        updatedAt: '2026-10-16T10:00:00.000Z',
      },
      {
        id: 'garden',
        name: 'Garden Study',
        minecraftVersion: '1.20.4',
        size: { x: 48, y: 32, z: 48 },
        structureMode: 'huge-structure-blocks',
        updatedAt: '2026-10-15T10:00:00.000Z',
      },
      {
        id: 'tower',
        name: 'Tower 2',
        minecraftVersion: '1.21.1',
        size: { x: 24, y: 48, z: 24 },
        structureMode: 'vanilla-structure-block',
        updatedAt: '2026-10-14T10:00:00.000Z',
      },
    ];
    const workflow = {
      projects: signal(projects),
      error: signal<string | undefined>(undefined),
      listError: signal(false),
      loadStatus: signal<'loading' | 'ready' | 'error'>('ready'),
      creating: signal(false),
      openingId: signal<string | undefined>(undefined),
      deletingProjectIds: signal<ReadonlySet<string>>(new Set()),
      deleteError: signal<string | undefined>(undefined),
      createProject: vi.fn(async () => undefined),
      loadProjects: vi.fn(async () => undefined),
      loadProjectPreview: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      imports: [ProjectScreenComponent],
      providers: [
        { provide: ProjectPreviewService, useValue: { updates: EMPTY } },
        {
          provide: MojangVersionService,
          useValue: { releases: signal([]), loadReleases: vi.fn(async () => []) },
        },
      ],
    });
    TestBed.overrideComponent(ProjectScreenComponent, {
      set: { providers: [{ provide: ProjectScreenWorkflow, useValue: workflow }] },
    });
    await TestBed.compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    fixture.detectChanges();
    const cardNames = (): string[] =>
      Array.from(root.querySelectorAll('.project-row strong')).map(
        (name) => name.textContent?.trim() ?? '',
      );
    expect(cardNames()).toEqual(['Lakeside Cabin', 'Garden Study', 'Tower 2']);
    expect(root.querySelectorAll('.project-row app-project-screen-preview')).toHaveLength(3);
    const projectNote = root.querySelector('.project-note');
    expect(projectNote?.textContent).toContain('Selected project');
    expect(projectNote?.textContent).toContain('Lakeside Cabin');
    expect(projectNote?.textContent).toContain('Minecraft Java 1.21.1');
    expect(projectNote?.textContent).toContain('16 × 16 × 16');
    expect(projectNote?.textContent).toContain('Vanilla Structure Block');
    expect(projectNote?.querySelector('app-project-screen-preview')).toBeNull();

    (root.querySelector('.project-create-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    const createMenuItems = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.project-create-menu-item'),
    );
    expect(createMenuItems).toHaveLength(2);
    expect(createMenuItems[0].textContent).toContain('Start a new project');
    expect(createMenuItems[1].textContent).toContain('Create from Structure JSON');
    createMenuItems[0].click();
    fixture.detectChanges();
    const projectName = root.querySelector('.project-text-input') as HTMLInputElement;
    expect(projectName.value).toBe('Untitled structure');
    i18n.setLocale('vi');
    fixture.detectChanges();
    expect(projectName.value).toBe('Cấu trúc chưa đặt tên');
    await (
      fixture.componentInstance as unknown as { createProject(): Promise<void> }
    ).createProject();
    expect(workflow.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Cấu trúc chưa đặt tên' }),
    );

    projectName.value = 'My workshop';
    projectName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    i18n.setLocale('en');
    fixture.detectChanges();
    expect(projectName.value).toBe('My workshop');
    workflow.createProject.mockClear();
    await (
      fixture.componentInstance as unknown as { createProject(): Promise<void> }
    ).createProject();
    expect(workflow.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My workshop' }),
    );

    const search = fixture.nativeElement.querySelector(
      '.project-search-field input',
    ) as HTMLInputElement;
    search.value = 'cabin';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(cardNames()).toEqual(['Lakeside Cabin']);
    expect(root.querySelectorAll('.project-row app-project-screen-preview')).toHaveLength(1);

    search.value = 'unmatched';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.project-list-empty').textContent).toContain(
      'No projects match your search.',
    );
    expect(root.querySelectorAll('.project-row app-project-screen-preview')).toHaveLength(0);

    search.value = '';
    search.dispatchEvent(new Event('input'));
    const sort = fixture.nativeElement.querySelector('.project-sort') as HTMLSelectElement;
    sort.value = 'name';
    sort.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(cardNames()).toEqual(['Garden Study', 'Lakeside Cabin', 'Tower 2']);
    expect(root.querySelectorAll('.project-row app-project-screen-preview')).toHaveLength(3);
    expect(root.querySelectorAll('.board-actions .project-create-trigger')).toHaveLength(1);

    workflow.projects.set([]);
    fixture.detectChanges();
    expect(root.querySelector('.board-actions .project-create-trigger')).not.toBeNull();
    expect(root.querySelector('.project-list-controls')).toBeNull();
    expect(root.querySelector('.project-note')?.textContent).toContain('Start a new project');
    fixture.destroy();
  });
});
