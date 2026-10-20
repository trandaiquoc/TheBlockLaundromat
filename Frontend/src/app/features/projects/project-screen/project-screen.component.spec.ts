// @ts-expect-error Vitest checks this template contract in Node.
import { readFileSync } from 'node:fs';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { MojangVersionService } from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ProjectScreenComponent } from './project-screen.component';
import { ProjectBackupWorkflow } from './project-backup-workflow';
import { ProjectScreenWorkflow } from './project-screen-workflow';

const templatePath = 'src/app/features/projects/project-screen/project-screen.component.html';

describe('ProjectScreenComponent', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

  it('uses the traditional Project Screen structure and keeps project creation inline', () => {
    const template = String(readFileSync(templatePath, 'utf8'));

    expect(template).toContain('assets/brand/the-block-laundromat-logo.svg');
    expect(template).toContain('class="project-intro"');
    expect(template).toContain('class="project-form"');
    expect(template).toContain('class="recent-projects"');
    expect(template).toContain('<app-project-screen-account');
    expect(template).toContain('projectName');
    expect(template).toContain('structureSize');
    expect(template).toContain('createFromStructureJson');
    expect(template).not.toContain('app-project-screen-scene');
    expect(template).not.toContain('scene-stage');
    expect(template).not.toContain('project-board');
    expect(template).not.toContain('washer-');
  });

  it('keeps the import dialog focused and exposes project list search and sort controls', () => {
    const template = String(readFileSync(templatePath, 'utf8'));

    expect(template).toMatch(/<h2\s+cdkFocusInitial\s+tabindex="-1"/);
    expect(template).toContain('(input)="updateProjectSearch($event)"');
    expect(template).toContain('(change)="updateProjectOrder($event)"');
    expect(template).toContain("i18n.t('open')");
    expect(template).toContain("i18n.t('deleteProjectAriaLabel')");
  });

  it('filters and sorts recent projects in the traditional list', async () => {
    const projects: readonly ProjectSummary[] = [
      summary('cabin', 'Lakeside Cabin', '2026-10-16T10:00:00.000Z'),
      summary('garden', 'Garden Study', '2026-10-15T10:00:00.000Z'),
      summary('tower', 'Tower 2', '2026-10-14T10:00:00.000Z'),
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
      clearError: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ProjectScreenComponent],
      providers: [
        {
          provide: MojangVersionService,
          useValue: { releases: signal([]), loadReleases: vi.fn(async () => []) },
        },
      ],
    });
    TestBed.overrideComponent(ProjectScreenComponent, {
      set: {
        providers: [
          { provide: ProjectScreenWorkflow, useValue: workflow },
          {
            provide: ProjectBackupWorkflow,
            useValue: {
              preview: signal(undefined),
              collision: signal(false),
              failure: signal(undefined),
              busy: signal(undefined),
              reset: vi.fn(),
              selectFile: vi.fn(async () => undefined),
              restore: vi.fn(async () => undefined),
              export: vi.fn(async () => undefined),
            },
          },
        ],
      },
    });
    await TestBed.compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en');
    fixture.detectChanges();
    const names = (): string[] =>
      Array.from(root.querySelectorAll('.project-row strong')).map(
        (element) => element.textContent?.trim() ?? '',
      );
    expect(names()).toEqual(['Lakeside Cabin', 'Garden Study', 'Tower 2']);

    const search = root.querySelector('.project-search-field input') as HTMLInputElement;
    search.value = 'cabin';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(names()).toEqual(['Lakeside Cabin']);

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const sort = root.querySelector('.project-sort') as HTMLSelectElement;
    sort.value = 'name';
    sort.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(names()).toEqual(['Garden Study', 'Lakeside Cabin', 'Tower 2']);
    fixture.destroy();
  });
});

function summary(id: string, name: string, updatedAt: string): ProjectSummary {
  return {
    id,
    name,
    minecraftVersion: '1.21.1',
    size: { x: 16, y: 16, z: 16 },
    structureMode: 'vanilla-structure-block',
    updatedAt,
  };
}
