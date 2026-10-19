import {
  Component,
  afterNextRender,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import { GroupService } from '../../../core/editor/groups/group.service';
import { normalizeGroupName } from '../../../core/editor/groups/group-naming';
import { SelectionService } from '../../../core/editor/selection/selection.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { DialogService } from '../../../core/ui/dialog/dialog.service';
import { filterGroups } from '../../../core/editor/groups/group-search';
import type { ProjectGroup } from '../../../core/domain/project.types';
import {
  LucideBlocks,
  LucideCheck,
  LucideEye,
  LucideEyeOff,
  LucideFocus,
  LucideFolderPlus,
  LucideLock,
  LucideLockOpen,
  LucideMinus,
  LucideMove,
  LucidePlus,
  LucideTrash2,
  LucideX,
  LucideEllipsis,
  LucidePencil,
} from '@lucide/angular';
import { UiTooltipDirective } from '../../../shared/ui/tooltip/ui-tooltip.directive';
import { WorkspaceStateService } from '../../../core/workspace/workspace-state.service';

type GroupNameEditor = { readonly projectId: string | undefined } & (
  { readonly kind: 'create' } | { readonly kind: 'rename'; readonly id: string }
);

@Component({
  selector: 'app-groups-panel',
  imports: [
    NgTemplateOutlet,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    LucideBlocks,
    LucideCheck,
    LucideEye,
    LucideEyeOff,
    LucideFocus,
    LucideFolderPlus,
    LucideLock,
    LucideLockOpen,
    LucideMinus,
    LucideMove,
    LucidePlus,
    LucideTrash2,
    LucideX,
    LucideEllipsis,
    LucidePencil,
    UiTooltipDirective,
  ],
  templateUrl: './groups-panel.component.html',
  styleUrl: './groups-panel.component.scss',
})
export class GroupsPanelComponent {
  protected readonly groups = inject(GroupService);
  protected readonly workspace = inject(WorkspaceStateService);
  protected readonly selection = inject(SelectionService);
  protected readonly i18n = inject(I18nService);
  private readonly dialogs = inject(DialogService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  readonly movePanelVisible = input(false);
  readonly movePanelToggle = output<void>();
  protected readonly editor = signal<GroupNameEditor | undefined>(undefined);
  protected readonly draftName = signal('');
  protected readonly submitted = signal(false);
  protected readonly groupSearch = signal('');
  protected readonly groupSummaries = computed(() =>
    filterGroups(this.workspace.project()?.groups ?? [], this.groupSearch(), {
      locked: this.i18n.t('locked'),
      unlocked: this.i18n.t('unlocked'),
    }).map((group) => ({ ...group, blockCount: this.groups.groupBlockCount(group.id) })),
  );
  protected readonly groupCount = computed(() => this.workspace.project()?.groups.length ?? 0);
  protected readonly hasSelection = computed(() => this.selection.hasAny(this.workspace.project()));
  protected readonly nameError = computed(() => {
    if (!this.editor()) return '';
    const name = normalizeGroupName(this.draftName()),
      editor = this.editor();
    if (!name) return this.i18n.t('groupNameRequired');
    return this.workspace
      .project()
      ?.groups.some(
        (group) =>
          !(editor?.kind === 'rename' && editor.id === group.id) &&
          normalizeGroupName(group.name) === name,
      )
      ? this.i18n.t('groupNameDuplicate')
      : '';
  });

  constructor() {
    effect(() => {
      const input = this.nameInput()?.nativeElement;
      if (input)
        queueMicrotask(() => {
          if (!this.destroyRef.destroyed) {
            input.focus();
            input.select();
          }
        });
    });
    effect(() => {
      const editor = this.editor(),
        project = this.workspace.project();
      if (
        editor &&
        (editor.projectId !== project?.id ||
          (editor.kind === 'rename' && !project?.groups.some((group) => group.id === editor.id)))
      )
        this.editor.set(undefined);
    });
  }
  protected beginCreate(): void {
    this.draftName.set('');
    this.submitted.set(false);
    this.editor.set({ kind: 'create', projectId: this.workspace.project()?.id });
  }
  protected beginRename(group: ProjectGroup): void {
    this.draftName.set(group.name);
    this.submitted.set(false);
    this.editor.set({ kind: 'rename', id: group.id, projectId: this.workspace.project()?.id });
  }
  protected submitName(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.submitted.set(true);
    const editor = this.editor();
    if (!editor || editor.projectId !== this.workspace.project()?.id || this.nameError()) return;
    const name = this.draftName().trim();
    if (editor.kind === 'create') {
      if (!this.groups.create(name)) return;
      this.groupSearch.set('');
      this.editor.set(undefined);
      this.restoreFocus(this.groups.activeGroupId(), 'select');
    } else {
      const current = this.workspace.project()?.groups.find((g) => g.id === editor.id);
      if (current?.name !== name && !this.groups.rename(editor.id, name)) return;
      this.editor.set(undefined);
      this.restoreFocus(editor.id, 'menu');
    }
  }
  protected cancelName(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const editor = this.editor();
    this.editor.set(undefined);
    this.restoreFocus(editor?.kind === 'rename' ? editor.id : undefined, 'menu');
  }
  private restoreFocus(id: string | undefined, action: 'menu' | 'select'): void {
    afterNextRender(
      () => {
        if (this.destroyRef.destroyed) return;
        const row = [
          ...this.host.nativeElement.querySelectorAll<HTMLElement>('[data-group-id]'),
        ].find((element) => element.dataset['groupId'] === id);
        const target =
          row?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`) ??
          this.host.nativeElement.querySelector<HTMLButtonElement>('.new-group');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
  protected clearGroupSearch(input: HTMLInputElement): void {
    this.groupSearch.set('');
    input.focus();
  }
  protected deleteGroup(id: string): void {
    if (this.groups.delete(id)) this.restoreFocus(undefined, 'select');
  }
  protected async deleteGroupBlocks(group: ProjectGroup): Promise<void> {
    // Opening a row's menu never changes active selection or a pending move.
    const projectId = this.workspace.project()?.id;
    if (this.groups.activeGroupId() !== group.id || group.locked) return;
    const count = this.groups.activeGroupBlockCount();
    if (!count) return;
    const confirmed = await this.dialogs.confirm({
      title: this.i18n.t('deleteGroupBlocksTitle'),
      text: this.i18n
        .t('deleteGroupBlocksConfirmation')
        .replace('{count}', String(count))
        .replace('{name}', group.name),
      confirmButtonText: this.i18n.t('deleteGroupBlocksConfirm'),
      cancelButtonText: this.i18n.t('cancel'),
      destructive: true,
    });
    if (
      confirmed &&
      !this.destroyRef.destroyed &&
      this.workspace.project()?.id === projectId &&
      this.groups.activeGroupId() === group.id
    )
      this.groups.deleteActiveBlocks();
  }
}
