import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { LucideFileUp, LucideX } from '@lucide/angular';
import { DEFAULT_MINECRAFT_VERSION } from '../../core/domain/project.types';
import type {
  StructureJsonProjectImportError,
  StructureJsonProjectImportPreview,
} from '../../core/persistence/structure-json/import/structure-json-project-import';
import { I18nService } from '../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../core/ui/localization/translation-catalogs';
import { ProjectBackupWorkflow, type BackupFailure } from './project-backup-workflow';
import { ProjectWorkflow } from './project-workflow';
import { StructureJsonProjectImportWorkflow } from './structure-json-project-import-workflow';

@Component({
  selector: 'app-project-utilities',
  imports: [CdkTrapFocus, LucideFileUp, LucideX],
  providers: [ProjectBackupWorkflow],
  templateUrl: './project-utilities.component.html',
  styleUrl: './project-utilities.component.scss',
})
export class ProjectUtilitiesComponent {
  readonly variant = input<'inline' | 'compact'>('inline');
  protected readonly i18n = inject(I18nService);
  private readonly workflow = inject(ProjectWorkflow);
  protected readonly backup = inject(ProjectBackupWorkflow);
  protected readonly backupDialogOpen = signal(false);
  protected readonly creating = this.workflow.creating;
  protected readonly openingId = this.workflow.openingId;
  protected readonly defaultMinecraftVersion = DEFAULT_MINECRAFT_VERSION;
  private readonly backupTrigger = viewChild<ElementRef<HTMLButtonElement>>('backupTrigger');
  private readonly structureJsonCreateTrigger = viewChild<ElementRef<HTMLButtonElement>>(
    'structureJsonCreateTrigger',
  );
  protected readonly structureJsonImport = new StructureJsonProjectImportWorkflow((project) =>
    this.workflow.createImportedProject(project),
  );

  protected openStructureJsonPicker(input: HTMLInputElement): void {
    if (!this.structureJsonImport.creating()) input.click();
  }

  protected openBackupDialog(): void {
    this.backup.reset();
    this.backupDialogOpen.set(true);
  }

  protected closeBackupDialog(): void {
    if (this.backup.busy() === 'saving') return;
    this.backup.reset();
    this.backupDialogOpen.set(false);
    queueMicrotask(() => this.backupTrigger()?.nativeElement.focus({ preventScroll: true }));
  }

  protected async selectBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) await this.backup.selectFile(file);
  }

  protected backupFailureLabel(failure: BackupFailure): string {
    const key = {
      'file-type': 'backupFileType',
      'file-too-large': 'backupFileTooLarge',
      read: 'projectBackupReadFailed',
      'invalid-json': 'projectBackupInvalidJson',
      'not-project-package': 'projectBackupNotRecognized',
      'unsupported-package-version': 'projectBackupUnsupportedVersion',
      'unsupported-project-schema': 'importUnsupportedSchema',
      'invalid-project-data': 'importInvalidData',
      storage: 'importStorageFailed',
    } satisfies Record<BackupFailure, TranslationKey>;
    return this.i18n.t(key[failure]);
  }

  protected async restoreBackup(): Promise<void> {
    const restored = await this.backup.restore();
    if (!restored) return;
    await this.workflow.loadProjects();
    this.closeBackupDialog();
  }

  protected async selectStructureJson(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.structureJsonImport.selectFile(file, this.i18n.t('untitledStructure'));
  }

  protected closeStructureJsonImport(): void {
    const wasOpen = this.structureJsonImport.open();
    this.structureJsonImport.close();
    if (!wasOpen || this.structureJsonImport.open()) return;
    queueMicrotask(() =>
      this.structureJsonCreateTrigger()?.nativeElement.focus({ preventScroll: true }),
    );
  }

  protected async createProjectFromStructureJson(): Promise<void> {
    const project = await this.structureJsonImport.createProject();
    if (!project) return;
    await this.workflow.activateImportedProject(project);
  }

  protected structureJsonImportProgressLabel(): string {
    const progress = this.structureJsonImport.progress();
    if (progress === 'reading') return this.i18n.t('structureJsonProjectReading');
    if (progress === 'parsing') return this.i18n.t('structureJsonProjectParsing');
    if (progress === 'checking') return this.i18n.t('structureJsonProjectChecking');
    if (progress === 'saving') return this.i18n.t('structureJsonProjectSaving');
    return '';
  }

  protected structureJsonImportErrorMessage(): string {
    const failure = this.structureJsonImport.failure();
    if (!failure) return '';
    if (failure.kind === 'file-type') return this.i18n.t('structureJsonFileTypeError');
    if (failure.kind === 'file-size') return this.i18n.t('structureJsonFileSizeError');
    if (failure.kind === 'parse') return this.structureJsonValidationError(failure.code);
    if (failure.kind === 'prepare') return this.structureJsonProjectImportError(failure.code);
    return this.i18n.t(
      failure.kind === 'save' ? 'createStorageError' : 'structureJsonProjectFileReadError',
    );
  }

  protected structureJsonImportModeLabel(preview: StructureJsonProjectImportPreview): string {
    return this.i18n.t(
      preview.structureMode === 'huge-structure-blocks'
        ? 'hugeStructureBlocks'
        : 'vanillaStructureBlock',
    );
  }

  private structureJsonValidationError(code: string | undefined): string {
    const key =
      code === 'invalid-json'
        ? 'structureJsonValidationInvalidJson'
        : code === 'format'
          ? 'structureJsonValidationFormat'
          : code === 'version'
            ? 'structureJsonValidationVersion'
            : code === 'minecraft-version'
              ? 'structureJsonValidationMinecraftVersion'
              : code === 'block'
                ? 'structureJsonValidationBlock'
                : 'structureJsonValidationShape';
    return this.i18n.t(key);
  }

  private structureJsonProjectImportError(code: StructureJsonProjectImportError): string {
    const key = (
      {
        'empty-structure': 'structureJsonProjectEmpty',
        'negative-coordinates': 'structureJsonProjectNegativeCoordinates',
        'unsupported-size': 'hugeStructureBlocksLimitExceeded',
        validation: 'structureJsonProjectValidationError',
        'invalid-project': 'structureJsonProjectValidationError',
      } as const
    )[code];
    return this.i18n.t(key);
  }
}
