import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  LucideArrowLeft,
  LucideChevronLeft,
  LucideChevronRight,
  LucideFolderOpen,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import {
  DEFAULT_MINECRAFT_VERSION,
  type ProjectSize,
  type StructureMode,
} from '../../../core/domain/project.types';
import {
  DEFAULT_STRUCTURE_MODE,
  effectiveStructureModeForSize,
  evaluateStructureSize,
  isStructureCreationAllowed,
} from '../../../core/domain/structure-size-policy';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import {
  MojangVersionService,
  type MojangRelease,
} from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { SearchableDropdownComponent } from '../../../shared/ui/searchable-dropdown/searchable-dropdown.component';
import { ProjectUtilitiesComponent } from '../../projects/project-utilities.component';
import { filterAndSortProjectSummaries, isProjectOrder } from '../../projects/project-list';
import type { ProjectOrder } from '../../projects/project-list';
import { ProjectWorkflow } from '../../projects/project-workflow';
import { DioramaProjectProjectionBridge } from './diorama-project-projection-bridge';
import type {
  DioramaProjectProjection,
  DioramaProjectSurface,
} from './diorama-project-anchor-projector';
import { cssMatrix3d, projectiveMatrix3dFromQuad } from './diorama-projective-transform';

const notePalette = ['rose', 'gold', 'sage', 'blue', 'lilac'] as const;
const notesPerPage = 4;

@Component({
  selector: 'app-diorama-project-workspace',
  imports: [
    CdkTrapFocus,
    DatePipe,
    LucideArrowLeft,
    LucideChevronLeft,
    LucideChevronRight,
    LucideFolderOpen,
    LucidePlus,
    LucideSearch,
    LucideTrash2,
    LucideX,
    ProjectUtilitiesComponent,
    SearchableDropdownComponent,
  ],
  templateUrl: './diorama-project-workspace.component.html',
  styleUrl: './diorama-project-workspace.component.scss',
})
export class DioramaProjectWorkspaceComponent {
  readonly overviewRequested = output<void>();

  protected readonly i18n = inject(I18nService);
  protected readonly workflow = inject(ProjectWorkflow);
  private readonly previewService = inject(ProjectPreviewService);
  private readonly preferences = inject(UiPreferencesService);
  private readonly versions = inject(MojangVersionService);
  private readonly projectionBridge = inject(DioramaProjectProjectionBridge);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectionDiagnosticsEnabled =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dioramaPerf');
  private projectionCssBatchCount = 0;
  private projectionCssTotalMs = 0;
  protected readonly projects = this.workflow.projects;
  protected readonly selectedProjectId = this.workflow.selectedProjectId;
  protected readonly loadStatus = this.workflow.loadStatus;
  protected readonly openingId = this.workflow.openingId;
  protected readonly creating = this.workflow.creating;
  protected readonly deletingProjectIds = this.workflow.deletingProjectIds;
  protected readonly deleteError = this.workflow.deleteError;
  protected readonly projectSearch = signal('');
  protected readonly projectOrder = signal<ProjectOrder>('newest');
  protected readonly currentPage = signal(1);
  protected readonly noteColors = signal<Readonly<Record<string, (typeof notePalette)[number]>>>(
    {},
  );
  protected readonly previewUrl = signal<string | undefined>(undefined);
  protected readonly previewError = signal(false);
  protected readonly createDialogOpen = signal(false);
  protected readonly createDialogTab = signal<'create' | 'import'>('create');
  protected readonly projectName = signal(this.i18n.t('untitledStructure'));
  protected readonly sizeX = signal('16');
  protected readonly sizeY = signal('16');
  protected readonly sizeZ = signal('16');
  protected readonly minecraftVersion = signal<string>(DEFAULT_MINECRAFT_VERSION);
  protected readonly structureMode = signal<StructureMode>(DEFAULT_STRUCTURE_MODE);
  protected readonly versionOptions = computed(() => {
    const releases = this.versions.releases();
    const entries = releases.length
      ? releases
      : [
          {
            id: DEFAULT_MINECRAFT_VERSION,
            type: 'release' as const,
            url: '',
          } satisfies MojangRelease,
        ];
    return entries.map((release) => ({
      id: release.id,
      label: `Java ${release.id}`,
      secondary:
        release.id === DEFAULT_MINECRAFT_VERSION
          ? this.i18n.t('verifiedSupport')
          : this.i18n.t('resourceCompatibility'),
    }));
  });
  private readonly size = computed<ProjectSize>(() => ({
    x: Number(this.sizeX()),
    y: Number(this.sizeY()),
    z: Number(this.sizeZ()),
  }));
  protected readonly structureModeForSize = computed(() =>
    effectiveStructureModeForSize(
      this.size(),
      this.structureMode(),
      this.preferences.preferences().autoUseHugeStructureBlocks,
    ),
  );
  protected readonly sizePolicy = computed(() =>
    evaluateStructureSize(this.size(), this.structureModeForSize()),
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
  protected readonly selectedProject = computed(() =>
    this.projects().find(({ id }) => id === this.selectedProjectId()),
  );
  protected readonly hasSelectedProject = computed(() => !!this.selectedProject());
  protected readonly longProjectName = computed(
    () => (this.selectedProject()?.name.length ?? 0) > 12,
  );
  private readonly workspaceRoot = viewChild<ElementRef<HTMLElement>>('workspaceRoot');
  private readonly boardPanel = viewChild<ElementRef<HTMLElement>>('boardPanel');
  private readonly createDialogTabs = viewChild<ElementRef<HTMLElement>>('createDialogTabs');
  private readonly washerPreview = viewChild<ElementRef<HTMLElement>>('washerPreview');
  private readonly washerName = viewChild<ElementRef<HTMLElement>>('washerName');
  private readonly washerOpen = viewChild<ElementRef<HTMLButtonElement>>('washerOpen');
  private readonly washerDelete = viewChild<ElementRef<HTMLButtonElement>>('washerDelete');
  private readonly courierNote = viewChild<ElementRef<HTMLButtonElement>>('courierNote');
  private createDialogTrigger?: HTMLButtonElement;
  private disconnectProjection?: () => void;
  private latestProjection?: DioramaProjectProjection;
  private previewRequest = 0;
  private latestPreviewKey = '';
  private activePreviewUrl?: string;

  constructor() {
    void this.workflow.loadProjects();
    void this.loadVersions();
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
      const selected = this.selectedProject();
      this.applyWasherProjection(this.latestProjection);
      if (!selected) {
        this.resetPreview();
        return;
      }
      void this.loadPreview(selected);
    });
    effect(() => {
      if (this.currentPage() > this.pageCount()) this.currentPage.set(this.pageCount());
    });
    afterNextRender(() => {
      this.disconnectProjection = this.projectionBridge.connect((projection) =>
        this.applyProjection(projection),
      );
    });
    this.destroyRef.onDestroy(() => {
      this.disconnectProjection?.();
      this.resetPreview();
    });
  }

  protected noteColor(projectId: string): string {
    return this.noteColors()[projectId] ?? 'sage';
  }

  protected selectProject(project: ProjectSummary): void {
    this.workflow.selectProject(project.id);
  }

  protected async openSelectedProject(): Promise<void> {
    const project = this.selectedProject();
    if (project) await this.workflow.openProject(project.id);
  }

  protected async deleteSelectedProject(): Promise<void> {
    const project = this.selectedProject();
    if (!project) return;
    await this.workflow.deleteProject(project);
  }

  protected async deleteProject(project: ProjectSummary): Promise<void> {
    await this.workflow.deleteProject(project);
  }

  protected updateProjectSearch(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.projectSearch.set(event.target.value);
    this.currentPage.set(1);
  }

  protected updateProjectOrder(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    if (!isProjectOrder(event.target.value)) return;
    this.projectOrder.set(event.target.value);
    this.currentPage.set(1);
  }

  protected previousPage(): void {
    this.currentPage.update((page) => Math.max(1, page - 1));
  }

  protected nextPage(): void {
    this.currentPage.update((page) => Math.min(this.pageCount(), page + 1));
  }

  protected returnToOverview(): void {
    this.overviewRequested.emit();
  }

  protected openCreateDialog(event: Event): void {
    this.createDialogTrigger = event.currentTarget as HTMLButtonElement;
    this.workflow.clearError();
    this.createDialogTab.set('create');
    this.createDialogOpen.set(true);
  }

  openCourierProjectDialog(): void {
    this.createDialogTrigger = undefined;
    this.workflow.clearError();
    this.createDialogTab.set('create');
    this.createDialogOpen.set(true);
  }

  protected selectCreateDialogTab(tab: 'create' | 'import'): void {
    this.createDialogTab.set(tab);
  }

  protected handleCreateDialogTabKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tab = event.key === 'ArrowRight' ? 'import' : 'create';
    this.createDialogTab.set(tab);
    queueMicrotask(() =>
      this.createDialogTabs()
        ?.nativeElement.querySelector<HTMLButtonElement>(`[data-project-tab="${tab}"]`)
        ?.focus({ preventScroll: true }),
    );
  }

  protected handleCreateDialogEscape(event: Event): void {
    if (event.target instanceof HTMLElement && event.target.closest('.project-import-dialog')) {
      return;
    }
    this.closeCreateDialog();
  }

  protected closeCreateDialog(): void {
    if (this.creating()) return;
    this.createDialogOpen.set(false);
    queueMicrotask(() => this.createDialogTrigger?.focus({ preventScroll: true }));
  }

  protected updateProjectName(value: string): void {
    this.projectName.set(value);
  }

  protected updateSize(axis: 'x' | 'y' | 'z', value: string): void {
    if (axis === 'x') this.sizeX.set(value);
    else if (axis === 'y') this.sizeY.set(value);
    else this.sizeZ.set(value);
    if (evaluateStructureSize(this.size()).fitsVanilla) {
      this.structureMode.set(DEFAULT_STRUCTURE_MODE);
    }
    this.workflow.clearError();
  }

  protected setMinecraftVersion(value: string): void {
    if (value) this.minecraftVersion.set(value);
  }

  protected setVanillaMax(): void {
    this.sizeX.set('48');
    this.sizeY.set('48');
    this.sizeZ.set('48');
    this.structureMode.set(DEFAULT_STRUCTURE_MODE);
  }

  protected useHugeStructureBlocks(): void {
    const policy = this.sizePolicy();
    if (policy.exceedsVanilla && policy.fitsHugeStructureBlocks) {
      this.structureMode.set('huge-structure-blocks');
    }
  }

  protected canCreateProject(): boolean {
    return isStructureCreationAllowed(this.size(), this.structureModeForSize());
  }

  protected async createProject(): Promise<void> {
    const created = await this.workflow.createProject({
      name: this.projectName(),
      minecraftVersion: this.minecraftVersion(),
      size: this.size(),
      structureMode: this.structureModeForSize(),
    });
    if (created) this.createDialogOpen.set(false);
  }

  private async loadVersions(): Promise<void> {
    try {
      await this.versions.loadReleases();
    } catch {
      // The 1.21.1 fallback remains available while release metadata is offline.
    }
  }

  private async loadPreview(project: ProjectSummary): Promise<void> {
    const key = `${project.id}\u0000${project.updatedAt}`;
    if (key === this.latestPreviewKey) return;
    this.latestPreviewKey = key;
    const request = ++this.previewRequest;
    this.previewError.set(false);
    this.releasePreviewUrl();
    this.previewUrl.set(undefined);
    try {
      const preview = await this.previewService.openPreview(project.id, project.updatedAt);
      if (!this.isCurrentPreviewRequest(request, project)) return;
      if (!preview) return;
      const url = URL.createObjectURL(preview);
      if (!this.isCurrentPreviewRequest(request, project)) {
        URL.revokeObjectURL(url);
        return;
      }
      this.activePreviewUrl = url;
      this.previewUrl.set(url);
    } catch {
      if (this.isCurrentPreviewRequest(request, project)) this.previewError.set(true);
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
    this.previewError.set(false);
  }

  private releasePreviewUrl(): void {
    if (!this.activePreviewUrl) return;
    URL.revokeObjectURL(this.activePreviewUrl);
    this.activePreviewUrl = undefined;
  }

  private applyProjection(projection: DioramaProjectProjection | undefined): void {
    const startedAt = this.projectionDiagnosticsEnabled ? window.performance.now() : undefined;
    this.latestProjection = projection;
    this.applyBoardProjection(projection);
    this.applyWasherProjection(projection);
    this.applySurfaceProjection(this.courierNote()?.nativeElement, projection?.courierNote);
    if (startedAt !== undefined)
      this.recordProjectionCssDuration(window.performance.now() - startedAt);
  }

  private recordProjectionCssDuration(durationMs: number): void {
    const root = this.workspaceRoot()?.nativeElement;
    if (!root) return;
    this.projectionCssBatchCount++;
    this.projectionCssTotalMs += durationMs;
    root.dataset['projectionCssBatchCount'] = String(this.projectionCssBatchCount);
    root.dataset['projectionCssTotalMs'] = this.projectionCssTotalMs.toFixed(4);
  }

  private applyBoardProjection(projection: DioramaProjectProjection | undefined): void {
    const element = this.boardPanel()?.nativeElement;
    const board = projection?.board;
    if (!element) return;
    this.applySurfaceProjection(element, board);
  }

  private applyWasherProjection(projection: DioramaProjectProjection | undefined): void {
    const washer = projection?.washer;
    const preview = this.washerPreview()?.nativeElement;
    const name = this.washerName()?.nativeElement;
    if (!washer?.visible) {
      setVisible(preview, false);
      setVisible(name, false);
      setVisible(this.washerOpen()?.nativeElement, false);
      setVisible(this.washerDelete()?.nativeElement, false);
      return;
    }
    this.applySurfaceProjection(preview, {
      ...washer.preview,
      visible: washer.preview.visible && this.hasSelectedProject(),
    });
    this.applySurfaceProjection(name, {
      ...washer.projectName,
      visible: washer.projectName.visible && this.hasSelectedProject(),
    });
    this.applySurfaceProjection(this.washerOpen()?.nativeElement, {
      ...washer.open,
      visible: washer.open.visible && this.hasSelectedProject(),
    });
    this.applySurfaceProjection(this.washerDelete()?.nativeElement, {
      ...washer.delete,
      visible: washer.delete.visible && this.hasSelectedProject(),
    });
  }

  private applySurfaceProjection(
    element: HTMLElement | undefined,
    surface: DioramaProjectSurface | undefined,
  ): void {
    if (!element || !surface?.visible) {
      setVisible(element, false);
      return;
    }
    const corners = [
      surface.topLeft,
      surface.topRight,
      surface.bottomRight,
      surface.bottomLeft,
    ] as const;
    const matrix = projectiveMatrix3dFromQuad(corners, surface.layoutWidth, surface.layoutHeight);
    if (!matrix) {
      setVisible(element, false);
      return;
    }
    element.style.left = '0px';
    element.style.top = '0px';
    element.style.width = `${surface.layoutWidth}px`;
    element.style.height = `${surface.layoutHeight}px`;
    element.style.transform = cssMatrix3d(matrix);
    setVisible(element, true);
  }
}

function setVisible(element: HTMLElement | undefined, visible: boolean): void {
  if (!element) return;
  element.hidden = !visible;
  element.inert = !visible;
  element.setAttribute('aria-hidden', String(!visible));
}

function shuffledNotePalette(): (typeof notePalette)[number][] {
  const colors = [...notePalette];
  for (let index = colors.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
  }
  return colors;
}
