import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideCopy, LucideDownload, LucideX } from '@lucide/angular';
import { ProjectDocument } from '../../../../core/domain/project.types';
import { BlockLibraryService } from '../../../../core/blocks/catalog/block-library.service';
import { sanitizeFilename } from '../../../../core/persistence/file-name';
import {
  hasUnsupportedProjectBlockEntities,
  serializeStructureJson,
  StructureJsonValidationCode,
  validateStructureJson,
} from '../../../../core/persistence/structure-json/structure-json';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { UiTooltipDirective } from '../../../../shared/ui/tooltip/ui-tooltip.directive';

type CopyFeedback = 'success' | 'error' | undefined;

@Component({
  selector: 'app-structure-json-export-dialog',
  imports: [CdkTrapFocus, LucideCopy, LucideDownload, LucideX, UiTooltipDirective],
  templateUrl: './structure-json-export-dialog.component.html',
  styleUrl: './structure-json-export-dialog.component.scss',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class StructureJsonExportDialogComponent {
  protected readonly i18n = inject(I18nService);
  private readonly library = inject(BlockLibraryService);
  readonly project = input.required<ProjectDocument>();
  readonly closed = output<void>();
  protected readonly savedJson = signal('');
  protected readonly draftJson = signal('');
  protected readonly validationError = signal<string | undefined>(undefined);
  protected readonly feedback = signal<CopyFeedback>(undefined);
  protected readonly downloadGuardOpen = signal(false);
  protected readonly dirty = computed(() => this.savedJson() !== this.draftJson());

  ngOnInit(): void {
    const snapshot = serializeStructureJson(this.project(), this.resolveDefinition);
    this.savedJson.set(snapshot);
    this.draftJson.set(snapshot);
    this.validateDraft(snapshot);
  }

  protected onEscape(): void {
    if (this.downloadGuardOpen()) this.downloadGuardOpen.set(false);
    else this.close();
  }
  protected close(): void {
    this.closed.emit();
  }
  protected projectName(): string {
    return this.project().metadata.name;
  }
  protected blockCount(): number {
    return this.project().blocks.length;
  }
  protected decorationCount(): number {
    return this.project().decorations?.length ?? 0;
  }
  protected hasRawDecorationMetadata(): boolean {
    return (this.project().decorations ?? []).some(
      (decoration) => !!decoration.raw && Object.keys(decoration.raw).length > 0,
    );
  }
  protected hasUnsupportedBlockEntityData(): boolean {
    return hasUnsupportedProjectBlockEntities(this.project(), this.resolveDefinition);
  }
  protected setDraftJson(value: string): void {
    this.draftJson.set(value);
    this.validationError.set(undefined);
    this.feedback.set(undefined);
  }
  protected discardChanges(): void {
    this.draftJson.set(this.savedJson());
    this.validationError.set(undefined);
    this.feedback.set(undefined);
  }
  protected async copyJson(): Promise<void> {
    if (!this.validateDraft()) return;
    await this.copy(this.draftJson());
  }
  protected download(): void {
    if (this.dirty()) {
      this.downloadGuardOpen.set(true);
      return;
    }
    if (this.validateDraft(this.savedJson())) this.downloadText(this.savedJson());
  }
  protected downloadSaved(): void {
    if (!this.validateDraft(this.savedJson())) return;
    this.downloadGuardOpen.set(false);
    this.downloadText(this.savedJson());
  }
  protected downloadEdited(): void {
    if (!this.validateDraft()) return;
    this.downloadGuardOpen.set(false);
    this.downloadText(this.draftJson());
  }
  protected validationMessage(
    code: StructureJsonValidationCode | undefined,
    path?: string,
  ): string {
    const key =
      code === 'invalid-json'
        ? 'structureJsonValidationInvalidJson'
        : code === 'format'
          ? 'structureJsonValidationFormat'
          : code === 'version'
            ? 'structureJsonValidationVersion'
            : code === 'minecraft-version'
              ? 'structureJsonValidationMinecraftVersion'
              : code === 'blocks'
                ? 'structureJsonValidationBlocks'
                : code === 'block'
                  ? 'structureJsonValidationBlock'
                  : code === 'block-entity'
                    ? 'structureJsonReasonInvalidBlockEntity'
                    : code === 'decorations'
                      ? 'structureJsonValidationDecorations'
                      : code === 'decoration'
                        ? 'structureJsonValidationDecoration'
                        : 'structureJsonValidationShape';
    return `${this.i18n.t(key)}${path ? ` (${path})` : ''}`;
  }
  private downloadText(value: string): void {
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilename(this.project().metadata.name)}.structure.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  private validateDraft(value = this.draftJson()): boolean {
    const result = validateStructureJson(value, this.resolveDefinition, this.resolveMaxStackSize);
    if (!result.valid) {
      this.validationError.set(this.validationMessage(result.code, result.path));
      return false;
    }
    this.validationError.set(undefined);
    return true;
  }
  private readonly resolveDefinition = (id: string) => this.library.get(id);
  private readonly resolveMaxStackSize = (id: string) => this.library.maxStackSizeFor(id);
  private async copy(value: string): Promise<void> {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      this.feedback.set('success');
    } catch {
      this.feedback.set('error');
    }
  }
}
