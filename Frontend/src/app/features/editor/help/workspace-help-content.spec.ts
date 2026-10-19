import { describe, expect, it } from 'vitest';
import { translations } from '../../../core/ui/localization/translation-catalogs';
import {
  WORKSPACE_HELP_ARTICLES,
  isWorkspaceHelpTopic,
  workspaceHelpTopic,
} from './workspace-help-content';

describe('workspace help content', () => {
  it('provides every article string in English and Vietnamese', () => {
    const english = translations.en as Readonly<Record<string, string>>;
    const vietnamese = translations.vi as Readonly<Record<string, string>>;
    for (const article of WORKSPACE_HELP_ARTICLES) {
      const keys = [
        article.titleKey,
        article.summaryKey,
        ...article.points,
        ...(article.noteKey ? [article.noteKey] : []),
      ];

      for (const key of keys) {
        expect(english[key], `English translation for ${key}`).toBeTruthy();
        expect(vietnamese[key], `Vietnamese translation for ${key}`).toBeTruthy();
      }
    }
  });

  it('accepts stable topic ids and defaults unknown deep links to Getting Started', () => {
    expect(isWorkspaceHelpTopic('undo-redo')).toBe(true);
    expect(isWorkspaceHelpTopic('unknown-topic')).toBe(false);
    expect(workspaceHelpTopic('assets-mods')).toBe('assets-mods');
    expect(workspaceHelpTopic('unknown-topic')).toBe('getting-started');
    expect(workspaceHelpTopic(null)).toBe('getting-started');
  });
});
