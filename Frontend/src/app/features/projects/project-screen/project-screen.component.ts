import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import {
  DEFAULT_MINECRAFT_VERSION,
  ProjectSize,
  StructureMode,
} from '../../../core/domain/project.types';
import {
  DEFAULT_STRUCTURE_MODE,
  effectiveStructureModeForSize,
  evaluateStructureSize,
  isStructureCreationAllowed,
} from '../../../core/domain/structure-size-policy';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import {
  UiPreferencesService,
  type HomepageMode,
} from '../../../core/ui/preferences/ui-preferences.service';
import { LucideFolderOpen, LucideSearch, LucideTrash2 } from '@lucide/angular';
import { UiTooltipDirective } from '../../../shared/ui/tooltip/ui-tooltip.directive';
import {
  SearchableDropdownComponent,
  SearchableDropdownOption,
} from '../../../shared/ui/searchable-dropdown/searchable-dropdown.component';
import {
  MojangRelease,
  MojangVersionService,
} from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { ProjectWorkflow } from '../project-workflow';
import { ProjectUtilitiesComponent } from '../project-utilities.component';
import { ProjectScreenThemePickerComponent } from './project-screen-theme-picker.component';
import { HomepageAccountMenuComponent } from '../../homepage/account-menu/homepage-account-menu.component';
import { filterAndSortProjectSummaries, isProjectOrder } from '../project-list';
import type { ProjectOrder } from '../project-list';

@Component({
  selector: 'app-project-screen',
  imports: [
    DatePipe,
    NgOptimizedImage,
    LucideFolderOpen,
    LucideSearch,
    LucideTrash2,
    UiTooltipDirective,
    SearchableDropdownComponent,
    ProjectUtilitiesComponent,
    ProjectScreenThemePickerComponent,
    HomepageAccountMenuComponent,
  ],
  templateUrl: './project-screen.component.html',
  styleUrl: './project-screen.component.scss',
})
export class ProjectScreenComponent {
  readonly homepageModeRequested = output<HomepageMode>();
  readonly settingsRequested = output<void>();

  protected readonly i18n = inject(I18nService);
  private readonly preferences = inject(UiPreferencesService);
  protected readonly workflow = inject(ProjectWorkflow);
  protected readonly name = signal(this.i18n.t('untitledStructure'));
  protected readonly sizeX = signal('16');
  protected readonly sizeY = signal('16');
  protected readonly sizeZ = signal('16');
  protected readonly minecraftVersion = signal<string>(DEFAULT_MINECRAFT_VERSION);
  protected readonly structureMode = signal<StructureMode>(DEFAULT_STRUCTURE_MODE);
  private readonly enteredSize = computed<ProjectSize>(() => ({
    x: Number(this.sizeX()),
    y: Number(this.sizeY()),
    z: Number(this.sizeZ()),
  }));
  protected readonly effectiveStructureMode = computed(() =>
    effectiveStructureModeForSize(
      this.enteredSize(),
      this.structureMode(),
      this.preferences.preferences().autoUseHugeStructureBlocks,
    ),
  );
  protected readonly sizePolicy = computed(() =>
    evaluateStructureSize(this.enteredSize(), this.effectiveStructureMode()),
  );
  protected readonly versions = inject(MojangVersionService);
  protected readonly versionOptions = computed<readonly SearchableDropdownOption[]>(() => {
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
  protected readonly projects = this.workflow.projects;
  protected readonly projectSearch = signal('');
  protected readonly projectOrder = signal<ProjectOrder>('newest');
  protected readonly visibleProjects = computed(() =>
    filterAndSortProjectSummaries(
      this.projects(),
      this.projectSearch(),
      this.projectOrder(),
      this.i18n.locale(),
    ),
  );
  protected readonly error = this.workflow.error;
  protected readonly loadStatus = this.workflow.loadStatus;
  protected readonly creating = this.workflow.creating;
  protected readonly openingId = this.workflow.openingId;
  protected readonly deletingProjectIds = this.workflow.deletingProjectIds;
  protected readonly deleteError = this.workflow.deleteError;
  constructor() {
    void this.workflow.loadProjects();
    void this.loadVersions();
  }

  protected updateName(value: string): void {
    this.name.set(value);
  }
  protected updateSize(axis: 'x' | 'y' | 'z', value: string): void {
    ({
      x: () => this.sizeX.set(value),
      y: () => this.sizeY.set(value),
      z: () => this.sizeZ.set(value),
    })[axis]();
    const nextSize = {
      x: Number(axis === 'x' ? value : this.sizeX()),
      y: Number(axis === 'y' ? value : this.sizeY()),
      z: Number(axis === 'z' ? value : this.sizeZ()),
    };
    if (evaluateStructureSize(nextSize).fitsVanilla) this.structureMode.set(DEFAULT_STRUCTURE_MODE);
    this.workflow.clearError();
  }
  protected setMinecraftVersion(value: string): void {
    if (value) this.minecraftVersion.set(value);
  }
  protected useHugeStructureBlocks(): void {
    if (this.sizePolicy().exceedsVanilla && this.sizePolicy().fitsHugeStructureBlocks)
      this.structureMode.set('huge-structure-blocks');
  }
  protected setVanillaMax(): void {
    this.sizeX.set('48');
    this.sizeY.set('48');
    this.sizeZ.set('48');
    this.structureMode.set(DEFAULT_STRUCTURE_MODE);
  }
  protected updateProjectSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.projectSearch.set(event.target.value);
  }
  protected updateProjectOrder(event: Event): void {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const value = event.target.value;
    if (isProjectOrder(value)) this.projectOrder.set(value);
  }
  protected versionSupportLabel(): string {
    return this.minecraftVersion() === DEFAULT_MINECRAFT_VERSION
      ? this.i18n.t('verifiedSupport')
      : this.i18n.t('resourceCompatibility');
  }
  protected summaryModeFullLabel(mode: StructureMode): string {
    return this.i18n.t(
      mode === 'huge-structure-blocks' ? 'hugeStructureBlocks' : 'vanillaStructureBlock',
    );
  }
  protected summarySizeLabel(project: ProjectSummary): string {
    return `${project.size.x} × ${project.size.y} × ${project.size.z}`;
  }
  protected summarySizeBadgeAriaLabel(project: ProjectSummary): string {
    return this.i18n
      .t('recentProjectSizeBadgeAria')
      .replace('{mode}', this.summaryModeFullLabel(project.structureMode))
      .replace('{size}', this.summarySizeLabel(project));
  }

  protected async createProject(): Promise<void> {
    await this.workflow.createProject({
      name: this.name(),
      minecraftVersion: this.minecraftVersion(),
      size: this.enteredSize(),
      structureMode: this.effectiveStructureMode(),
    });
  }

  protected async openProject(id: string): Promise<void> {
    await this.workflow.openProject(id);
  }

  protected async deleteProject(summary: ProjectSummary, event: Event): Promise<void> {
    event.stopPropagation();
    await this.workflow.deleteProject(summary);
  }

  protected async retryLoad(): Promise<void> {
    await this.workflow.loadProjects();
  }
  protected validDimensions(): boolean {
    return this.sizePolicy().dimensionsValid;
  }
  protected canCreateProject(): boolean {
    return isStructureCreationAllowed(this.enteredSize(), this.effectiveStructureMode());
  }
  private async loadVersions(): Promise<void> {
    try {
      await this.versions.loadReleases();
    } catch {
      /* Keep the safe 1.21.1 fallback when Mojang metadata is offline. */
    }
  }
}
