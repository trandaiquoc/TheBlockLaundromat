import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { LucideX } from '@lucide/angular';
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
import {
  MojangVersionService,
  type MojangRelease,
} from '../../../core/assets/vanilla/mojang-vanilla-asset-source';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { SearchableDropdownComponent } from '../../../shared/ui/searchable-dropdown/searchable-dropdown.component';
import { ProjectUtilitiesComponent } from '../../projects/project-utilities.component';
import { ProjectWorkflow } from '../../projects/project-workflow';

@Component({
  selector: 'app-diorama-project-paper-panel',
  imports: [CdkTrapFocus, LucideX, ProjectUtilitiesComponent, SearchableDropdownComponent],
  templateUrl: './diorama-project-paper-panel.component.html',
  styleUrl: './diorama-project-paper-panel.component.scss',
})
export class DioramaProjectPaperPanelComponent {
  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly i18n = inject(I18nService);
  protected readonly workflow = inject(ProjectWorkflow);
  private readonly preferences = inject(UiPreferencesService);
  private readonly versions = inject(MojangVersionService);
  protected readonly creating = this.workflow.creating;
  protected readonly openingId = this.workflow.openingId;
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
  private readonly dialogTabs = viewChild<ElementRef<HTMLElement>>('dialogTabs');

  constructor() {
    let wasOpen = false;
    effect(() => {
      const isOpen = this.open();
      if (isOpen && !wasOpen) {
        this.workflow.clearError();
        this.createDialogTab.set('create');
      }
      wasOpen = isOpen;
    });
    void this.loadVersions();
  }

  protected selectTab(tab: 'create' | 'import'): void {
    this.createDialogTab.set(tab);
  }

  protected handleTabKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tab = event.key === 'ArrowRight' ? 'import' : 'create';
    this.createDialogTab.set(tab);
    queueMicrotask(() =>
      this.dialogTabs()
        ?.nativeElement.querySelector<HTMLButtonElement>(`[data-project-tab="${tab}"]`)
        ?.focus({ preventScroll: true }),
    );
  }

  protected handleEscape(event: Event): void {
    if (event.target instanceof HTMLElement && event.target.closest('.project-import-dialog'))
      return;
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  protected close(): void {
    if (this.creating()) return;
    this.closed.emit();
  }

  protected updateProjectName(value: string): void {
    this.projectName.set(value);
  }

  protected updateSize(axis: 'x' | 'y' | 'z', value: string): void {
    if (axis === 'x') this.sizeX.set(value);
    else if (axis === 'y') this.sizeY.set(value);
    else this.sizeZ.set(value);
    if (evaluateStructureSize(this.size()).fitsVanilla)
      this.structureMode.set(DEFAULT_STRUCTURE_MODE);
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
    if (created) this.closed.emit();
  }

  private async loadVersions(): Promise<void> {
    try {
      await this.versions.loadReleases();
    } catch {
      // The 1.21.1 fallback remains available while release metadata is offline.
    }
  }
}
