// @ts-expect-error Vitest checks this template contract in Node.
import { readFileSync } from 'node:fs';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectDocument } from '../../../core/domain/project.types';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { MojangVersionService } from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ProjectScreenComponent } from './project-screen.component';
import { ProjectScreenWorkflow } from './project-screen-workflow';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';

describe('ProjectScreenComponent', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

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
    expect(template).toMatch(
      /@if \(theme\.theme\(\) === 'craft'\)\s*\{\s*<div class="washer-preview-surface" aria-hidden="true"><\/div>/,
    );
    expect(template.indexOf('class="washer-preview-surface"')).toBeLessThan(
      template.indexOf('@if (selectedProject(); as project)'),
    );
    expect(template).toContain('[project]="project"');
    expect(template).toContain('class="project-note"');
    expect(template).toContain('class="project-note-meta"');
    expect(template).toContain('class="washer-display"');
    expect(template).toContain('class="washer-display-meta"');
    expect(template).toContain("i18n.t('minecraftJavaVersion')");
    expect(template).toContain("i18n.t('structureSize')");
    expect(template).toContain('class="washer-actions"');
    expect(sceneTemplate).toContain('[ngSrc]="scene().room.src"');
    expect(sceneTemplate).toContain('[ngSrc]="exterior.src"');
    expect(sceneTemplate).toContain('scene().roomMask!');
    expect(sceneTemplate).toContain("theme() === 'craft'");
    expect(sceneTemplate).toContain('class="scene-layer--exterior"');
    expect(sceneTemplate).toContain('class="scene-layer--exterior-lighting"');
    expect(sceneTemplate).toContain('scene-layer--wall-sign');
    expect(sceneTemplate).toContain('scene-layer--washer');
    expect(sceneTemplate).toContain('scene-layer--board');
    expect(sceneTemplate).toContain('scene-layer--washer-mascot');
    expect(sceneTemplate).toContain('scene-layer--map-mascot');
    expect(sceneTemplate).toContain('class="scene-layer--foreground"');
  });

  it('keeps the official logo overlay for layered themes', () => {
    const sceneTemplate = String(
      readFileSync(
        'src/app/features/projects/project-screen/scene/project-screen-scene.component.html',
        'utf8',
      ),
    );

    expect(sceneTemplate).toContain('class="scene-layer--wall-sign"');
    expect(sceneTemplate).toContain('assets/brand/the-block-laundromat-logo.svg');
  });

  it('aligns real project controls to the Minecraft reference image', () => {
    const layoutStyles = String(
      readFileSync(
        'src/app/features/projects/project-screen/project-screen.component.scss',
        'utf8',
      ),
    );
    const craftDisplay = layoutStyles.match(
      /\[data-theme='craft'\] \.washer-display\s*\{([^}]+)\}/,
    )?.[1];
    const craftActions = layoutStyles.match(
      /\.project-page\[data-theme='craft'\] \.washer-actions\s*\{([^}]+)\}/,
    )?.[1];
    const craftBoard = layoutStyles.match(
      /\.project-page\[data-theme='craft'\] \.project-board\s*\{([^}]+)\}/,
    )?.[1];

    expect(craftDisplay).toContain('inset: 42% auto auto 30.4%');
    expect(craftDisplay).toContain('width: 11.5%');
    expect(craftDisplay).toContain('transform: none');
    expect(craftDisplay).toContain('filter: none');
    expect(craftActions).toContain('left: 52.4%');
    expect(craftActions).toContain('top: 50.1%');
    expect(craftBoard).toContain('left: 60.8%');
    expect(craftBoard).toContain('top: 35%');
    expect(craftBoard).not.toContain('background:');
    expect(craftBoard).not.toContain('clip-path:');
    expect(layoutStyles).toContain('create-project-tile-craft.png');
    expect(layoutStyles).toContain('transform: translate(-4.2%, 3.8%)');
    expect(layoutStyles).toContain('margin-left: 2rem');
    expect(layoutStyles).toContain(".project-page[data-theme='craft'] .scene-canvas");
    expect(layoutStyles).toContain('width: max(100vw, 177.68svh)');
    expect(layoutStyles).toContain('height: max(100svh, 56.28vw)');
    expect(layoutStyles).toContain('color: transparent');
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

    const preferences = TestBed.inject(UiPreferencesService);
    preferences.setAppearance({ preset: 'light' });
    preferences.update({ homeSpaceAnimations: true });
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
    const scene = (): HTMLElement => root.querySelector('.scene-background') as HTMLElement;
    const washerMascot = (): HTMLImageElement =>
      root.querySelector('.scene-layer--washer-mascot img') as HTMLImageElement;
    expect(scene().getAttribute('data-mascot-state')).toBe('selected');
    expect(scene().getAttribute('data-animations')).toBe('true');
    expect(washerMascot().getAttribute('src')).toContain('raccoon-washer-selected.webp');
    workflow.openingId.set('cabin');
    fixture.detectChanges();
    expect(scene().getAttribute('data-mascot-state')).toBe('opening');
    expect(washerMascot().getAttribute('src')).toContain('raccoon-washer-opening.webp');
    workflow.openingId.set(undefined);
    preferences.update({ homeSpaceAnimations: false });
    fixture.detectChanges();
    expect(scene().getAttribute('data-mascot-state')).toBe('selected');
    expect(scene().getAttribute('data-animations')).toBe('false');
    expect(washerMascot().getAttribute('src')).toContain('raccoon-washer-selected.webp');
    preferences.update({ homeSpaceAnimations: true });
    fixture.detectChanges();
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
    expect(scene().getAttribute('data-mascot-state')).toBe('create');
    expect(washerMascot().getAttribute('src')).toContain('raccoon-washer-create.webp');
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

    (fixture.componentInstance as unknown as { closeCreateDialog(): void }).closeCreateDialog();
    workflow.projects.set([]);
    fixture.detectChanges();
    expect(scene().getAttribute('data-mascot-state')).toBe('idle');
    expect(washerMascot().getAttribute('src')).toContain('raccoon-washer-idle.webp');
    expect(root.querySelector('.board-actions .project-create-trigger')).not.toBeNull();
    expect(root.querySelector('.project-note')?.textContent).toContain('Start a new project');
    expect(root.querySelector('.project-list-controls')).toBeNull();

    preferences.setAppearance({ preset: 'craft' });
    fixture.detectChanges();
    expect(root.querySelector('.board-actions .project-create-trigger')).toBeNull();
    expect(root.querySelector('.project-list .project-create-trigger--tile')).not.toBeNull();
    expect(root.querySelector('.project-list-controls')).not.toBeNull();
    expect(root.querySelector('.project-search-field input')?.getAttribute('placeholder')).toBe(
      'Search projects…',
    );
    expect(root.querySelector('.project-sort')).not.toBeNull();
    fixture.destroy();
  });
});
