import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideArrowLeft, LucideFolderOpen, LucideTrash2 } from '@lucide/angular';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { DioramaWasherOverlayProjection } from './diorama-washer-overlay-projector';
import { ProjectWorkflow } from '../../projects/project-workflow';

type PreviewState = 'loading' | 'ready' | 'missing' | 'error';

const hiddenOverlay = (): DioramaWasherOverlayProjection => ({
  preview: { x: 0, y: 0, visible: false },
  previewDiameter: 0,
  projectName: { x: 0, y: 0, width: 0, height: 0, visible: false },
});

@Component({
  selector: 'app-diorama-washer-panel',
  imports: [LucideArrowLeft, LucideFolderOpen, LucideTrash2],
  templateUrl: './diorama-washer-panel.component.html',
  styleUrl: './diorama-washer-panel.component.scss',
})
export class DioramaWasherPanelComponent {
  readonly active = input(false);
  readonly overlay = input<DioramaWasherOverlayProjection>(hiddenOverlay());
  readonly backRequested = output<void>();
  readonly boardRequested = output<void>();

  protected readonly i18n = inject(I18nService);
  protected readonly workflow = inject(ProjectWorkflow);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewService = inject(ProjectPreviewService);
  protected readonly selectedProject = computed(() => {
    const id = this.workflow.selectedProjectId();
    return this.workflow.projects().find((project) => project.id === id);
  });
  protected readonly previewUrl = signal<string | undefined>(undefined);
  protected readonly previewState = signal<PreviewState>('missing');
  protected readonly openingId = this.workflow.openingId;
  protected readonly creating = this.workflow.creating;
  protected readonly deletingProjectIds = this.workflow.deletingProjectIds;
  protected readonly deleteError = this.workflow.deleteError;
  protected hasLongProjectName(): boolean {
    return (this.selectedProject()?.name.length ?? 0) > 22;
  }
  private previewRequest = 0;
  private latestPreviewKey = '';
  private activePreviewUrl?: string;

  constructor() {
    this.destroyRef.onDestroy(() => this.resetPreview());
    effect(() => {
      const project = this.selectedProject();
      if (!project) {
        this.resetPreview();
        return;
      }
      void this.loadPreview(project);
    });
  }

  protected async openSelectedProject(): Promise<void> {
    const project = this.selectedProject();
    if (project) await this.workflow.openProject(project.id);
  }

  protected async deleteSelectedProject(): Promise<void> {
    const project = this.selectedProject();
    if (project) await this.workflow.deleteProject(project);
  }

  private async loadPreview(project: ProjectSummary): Promise<void> {
    const key = `${project.id}\u0000${project.updatedAt}`;
    if (key === this.latestPreviewKey) return;
    this.latestPreviewKey = key;
    const request = ++this.previewRequest;
    this.previewState.set('loading');
    this.releasePreviewUrl();
    this.previewUrl.set(undefined);
    try {
      const preview = await this.previewService.openPreview(project.id, project.updatedAt);
      if (!this.isCurrentPreviewRequest(request, project)) return;
      if (!preview) {
        this.previewState.set('missing');
        return;
      }
      const url = URL.createObjectURL(preview);
      if (!this.isCurrentPreviewRequest(request, project)) {
        URL.revokeObjectURL(url);
        return;
      }
      this.activePreviewUrl = url;
      this.previewUrl.set(url);
      this.previewState.set('ready');
    } catch {
      if (this.isCurrentPreviewRequest(request, project)) this.previewState.set('error');
    }
  }

  private isCurrentPreviewRequest(request: number, project: ProjectSummary): boolean {
    const selected = this.selectedProject();
    return (
      request === this.previewRequest &&
      selected?.id === project.id &&
      selected.updatedAt === project.updatedAt
    );
  }

  private resetPreview(): void {
    this.latestPreviewKey = '';
    this.previewRequest++;
    this.releasePreviewUrl();
    this.previewUrl.set(undefined);
    this.previewState.set('missing');
  }

  private releasePreviewUrl(): void {
    if (!this.activePreviewUrl) return;
    URL.revokeObjectURL(this.activePreviewUrl);
    this.activePreviewUrl = undefined;
  }
}
