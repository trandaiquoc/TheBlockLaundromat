import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { MojangVersionService } from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ProjectBackupWorkflow } from '../../projects/project-backup-workflow';
import { ProjectUtilitiesComponent } from '../../projects/project-utilities.component';
import { ProjectWorkflow } from '../../projects/project-workflow';
import { DioramaProjectPaperPanelComponent } from './diorama-project-paper-panel.component';

describe('DioramaProjectPaperPanelComponent', () => {
  it('retains Create and Import tabs and sends valid form data through ProjectWorkflow', async () => {
    const workflow = createWorkflow();
    TestBed.configureTestingModule({
      imports: [DioramaProjectPaperPanelComponent],
      providers: [
        { provide: ProjectWorkflow, useValue: workflow },
        {
          provide: MojangVersionService,
          useValue: { releases: signal([]), loadReleases: vi.fn(async () => []) },
        },
      ],
    });
    TestBed.overrideComponent(ProjectUtilitiesComponent, {
      set: {
        template: '<p>Import tools</p>',
        providers: [
          { provide: ProjectBackupWorkflow, useValue: {} },
          { provide: BlockLibraryService, useValue: {} },
        ],
      },
    });
    TestBed.inject(I18nService).setLocale('en');
    const fixture = TestBed.createComponent(DioramaProjectPaperPanelComponent);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.paper-backdrop')
        ?.hasAttribute('hidden'),
    ).toBe(true);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(root.querySelector('#diorama-project-import-panel')?.textContent).toContain(
      'Import tools',
    );

    tabs[0].click();
    fixture.detectChanges();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    (root.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(workflow.createProject).toHaveBeenCalledWith({
      name: 'Untitled structure',
      minecraftVersion: '1.21.1',
      size: { x: 16, y: 16, z: 16 },
      structureMode: 'vanilla-structure-block',
    });
    expect(closed).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('keeps invalid dimensions visible and prevents submission', () => {
    const workflow = createWorkflow();
    TestBed.configureTestingModule({
      imports: [DioramaProjectPaperPanelComponent],
      providers: [
        { provide: ProjectWorkflow, useValue: workflow },
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
    const fixture = TestBed.createComponent(DioramaProjectPaperPanelComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const x = root.querySelector('input[type="number"]') as HTMLInputElement;
    x.value = '0';
    x.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('positive whole numbers');
    expect(root.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
    expect(workflow.createProject).not.toHaveBeenCalled();
    fixture.destroy();
  });
});

function createWorkflow() {
  return {
    creating: signal(false),
    openingId: signal<string | undefined>(undefined),
    error: signal<string | undefined>(undefined),
    clearError: vi.fn(),
    createProject: vi.fn(async () => true),
  };
}
