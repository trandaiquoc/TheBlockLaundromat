import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { WorkspaceShortcutReferenceComponent } from './workspace-shortcut-reference.component';
import {
  WORKSPACE_HELP_ARTICLES,
  WORKSPACE_HELP_GROUPS,
  isWorkspaceHelpTopic,
} from './workspace-help-content';
import type {
  WorkspaceHelpArticle,
  WorkspaceHelpGroup,
  WorkspaceHelpTopicId,
} from './workspace-help-content';

@Component({
  selector: 'app-workspace-help-dialog',
  imports: [CdkTrapFocus, LucideX, WorkspaceShortcutReferenceComponent],
  templateUrl: './workspace-help-dialog.component.html',
  styleUrl: './workspace-help-dialog.component.scss',
  host: {
    '(document:keydown.escape)': 'closeFromEscape($event)',
  },
})
export class WorkspaceHelpDialogComponent {
  protected readonly i18n = inject(I18nService);
  readonly topic = input<WorkspaceHelpTopicId>('getting-started');
  readonly topicChange = output<WorkspaceHelpTopicId>();
  readonly closed = output<void>();
  protected readonly searchQuery = signal('');
  protected readonly articles = WORKSPACE_HELP_ARTICLES;
  protected readonly article = computed(
    () =>
      WORKSPACE_HELP_ARTICLES.find((item) => item.id === this.topic()) ??
      WORKSPACE_HELP_ARTICLES[0]!,
  );
  protected readonly filteredGroups = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return WORKSPACE_HELP_GROUPS.map((group) => ({
      group,
      articles: WORKSPACE_HELP_ARTICLES.filter(
        (item) => item.group === group && this.matchesSearch(item, query),
      ),
    })).filter(({ articles }) => articles.length > 0);
  });

  protected groupLabel(group: WorkspaceHelpGroup): string {
    const key: Record<WorkspaceHelpGroup, TranslationKey> = {
      start: 'workspaceHelpGroupStart',
      editing: 'workspaceHelpGroupEditing',
      inspect: 'workspaceHelpGroupInspect',
      manage: 'workspaceHelpGroupManage',
    };
    return this.i18n.t(key[group]);
  }

  protected selectTopic(value: string): void {
    if (isWorkspaceHelpTopic(value)) this.topicChange.emit(value);
  }

  protected selectTopicFromEvent(event: Event): void {
    this.selectTopic((event.currentTarget as HTMLSelectElement).value);
  }

  protected setSearchQuery(event: Event): void {
    this.searchQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected closeFromEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closed.emit();
  }

  protected topicTitle(article: WorkspaceHelpArticle): string {
    return this.i18n.t(article.titleKey);
  }

  protected close(): void {
    this.closed.emit();
  }

  private matchesSearch(article: WorkspaceHelpArticle, query: string): boolean {
    if (!query) return true;
    return [
      article.titleKey,
      article.summaryKey,
      ...article.points,
      ...(article.noteKey ? [article.noteKey] : []),
    ].some((key) => this.i18n.t(key).toLocaleLowerCase().includes(query));
  }
}
