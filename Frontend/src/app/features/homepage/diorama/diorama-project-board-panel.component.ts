import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  LucideArrowLeft,
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlus,
  LucideSearch,
} from '@lucide/angular';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { filterAndSortProjectSummaries, isProjectOrder } from '../../projects/project-list';
import type { ProjectOrder } from '../../projects/project-list';
import { ProjectWorkflow } from '../../projects/project-workflow';

const notePalette = ['rose', 'gold', 'sage', 'blue', 'lilac'] as const;
const notesPerPage = 4;

@Component({
  selector: 'app-diorama-project-board-panel',
  imports: [
    DatePipe,
    LucideArrowLeft,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePlus,
    LucideSearch,
  ],
  templateUrl: './diorama-project-board-panel.component.html',
  styleUrl: './diorama-project-board-panel.component.scss',
})
export class DioramaProjectBoardPanelComponent {
  readonly active = input(false);
  readonly backRequested = output<void>();
  readonly projectSelected = output<void>();
  readonly createRequested = output<HTMLButtonElement>();

  protected readonly i18n = inject(I18nService);
  protected readonly workflow = inject(ProjectWorkflow);
  protected readonly projects = this.workflow.projects;
  protected readonly selectedProjectId = this.workflow.selectedProjectId;
  protected readonly loadStatus = this.workflow.loadStatus;
  protected readonly openingId = this.workflow.openingId;
  protected readonly creating = this.workflow.creating;
  protected readonly projectSearch = signal('');
  protected readonly projectOrder = signal<ProjectOrder>('newest');
  protected readonly currentPage = signal(1);
  protected readonly noteColors = signal<Readonly<Record<string, (typeof notePalette)[number]>>>(
    {},
  );
  protected readonly visibleProjects = computed(() =>
    filterAndSortProjectSummaries(
      this.projects(),
      this.projectSearch(),
      this.projectOrder(),
      this.i18n.locale(),
    ),
  );
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.visibleProjects().length / notesPerPage)),
  );
  protected readonly pageProjects = computed(() => {
    const start = (this.currentPage() - 1) * notesPerPage;
    return this.visibleProjects().slice(start, start + notesPerPage);
  });

  constructor() {
    void this.workflow.loadProjects();
    effect(() => {
      const status = this.loadStatus();
      const projects = this.projects();
      if (status === 'loading') {
        this.noteColors.set({});
        return;
      }
      if (status !== 'ready') return;
      this.noteColors.update((current) => {
        const next: Record<string, (typeof notePalette)[number]> = {};
        const palette = shuffledNotePalette();
        let nextColor = 0;
        for (const project of projects) {
          next[project.id] = current[project.id] ?? palette[nextColor++ % palette.length];
        }
        return next;
      });
    });
    effect(() => {
      if (this.currentPage() > this.pageCount()) this.currentPage.set(this.pageCount());
    });
  }

  protected noteColor(projectId: string): string {
    return this.noteColors()[projectId] ?? 'sage';
  }

  protected selectProject(project: ProjectSummary): void {
    this.workflow.selectProject(project.id);
    this.projectSelected.emit();
  }

  protected updateProjectSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.projectSearch.set(event.target.value);
    this.currentPage.set(1);
  }

  protected updateProjectOrder(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement) || !isProjectOrder(event.target.value)) return;
    this.projectOrder.set(event.target.value);
    this.currentPage.set(1);
  }

  protected previousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((page) => Math.min(this.pageCount(), page + 1));
  }

  protected createProject(event: Event): void {
    this.createRequested.emit(event.currentTarget as HTMLButtonElement);
  }
}

function shuffledNotePalette(): (typeof notePalette)[number][] {
  const colors = [...notePalette];
  for (let index = colors.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }
  return colors;
}
