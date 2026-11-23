import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { ProjectWorkflow } from '../../projects/project-workflow';
import { DioramaProjectBoardPanelComponent } from './diorama-project-board-panel.component';

describe('DioramaProjectBoardPanelComponent', () => {
  it('searches, sorts, paginates, and routes selection through the shared workflow', () => {
    const projects = signal(createProjects());
    const selectedProjectId = signal<string | undefined>(undefined);
    const workflow = {
      projects,
      selectedProjectId,
      loadStatus: signal<'loading' | 'ready' | 'error'>('ready'),
      openingId: signal<string | undefined>(undefined),
      creating: signal(false),
      loadProjects: vi.fn(async () => undefined),
      selectProject: vi.fn((id: string) => selectedProjectId.set(id)),
    };
    TestBed.configureTestingModule({
      imports: [DioramaProjectBoardPanelComponent],
      providers: [{ provide: ProjectWorkflow, useValue: workflow }],
    });
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(DioramaProjectBoardPanelComponent);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.project-note')).toHaveLength(4);

    (root.querySelector('.board-panel__pagination button:last-child') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.project-note strong')?.textContent?.trim()).toBe('Project 2');

    const search = root.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'Project 1';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelectorAll('.project-note')).toHaveLength(1);

    const selected = vi.fn();
    fixture.componentInstance.projectSelected.subscribe(selected);
    (root.querySelector('.project-note__select') as HTMLButtonElement).click();
    expect(workflow.selectProject).toHaveBeenCalledWith('project-1');
    expect(selected).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('surfaces load errors with an explicit retry action', () => {
    const workflow = {
      projects: signal([]),
      selectedProjectId: signal<string | undefined>(undefined),
      loadStatus: signal<'loading' | 'ready' | 'error'>('error'),
      openingId: signal<string | undefined>(undefined),
      creating: signal(false),
      loadProjects: vi.fn(async () => undefined),
      selectProject: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [DioramaProjectBoardPanelComponent],
      providers: [{ provide: ProjectWorkflow, useValue: workflow }],
    });
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(DioramaProjectBoardPanelComponent);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.board-panel__message button') as HTMLButtonElement
    ).click();
    expect(workflow.loadProjects).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
});

function createProjects(): ProjectSummary[] {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `project-${index + 1}`,
    name: `Project ${index + 1}`,
    minecraftVersion: '1.21.1',
    size: { x: 16, y: 16, z: 16 },
    structureMode: 'vanilla-structure-block',
    updatedAt: `2026-11-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
}
