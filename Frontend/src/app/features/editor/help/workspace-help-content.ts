import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';

export type WorkspaceHelpGroup = 'start' | 'editing' | 'inspect' | 'manage';
export const WORKSPACE_HELP_GROUPS: readonly WorkspaceHelpGroup[] = [
  'start',
  'editing',
  'inspect',
  'manage',
];
export type WorkspaceHelpTopicId =
  | 'getting-started'
  | 'workspace-overview'
  | 'camera-navigation'
  | 'place-delete-pick-select'
  | 'undo-redo'
  | 'block-browser-quick-bar'
  | 'decorations-groups'
  | 'blockstate-inspector'
  | '3d-y-layer'
  | 'assets-mods'
  | 'import-export'
  | 'keyboard-mouse'
  | 'settings'
  | 'troubleshooting';

export interface WorkspaceHelpArticle {
  readonly id: WorkspaceHelpTopicId;
  readonly group: WorkspaceHelpGroup;
  readonly titleKey: TranslationKey;
  readonly summaryKey: TranslationKey;
  readonly points: readonly TranslationKey[];
  readonly noteKey?: TranslationKey;
}

export const WORKSPACE_HELP_ARTICLES: readonly WorkspaceHelpArticle[] = [
  {
    id: 'getting-started',
    group: 'start',
    titleKey: 'helpGettingStartedTitle',
    summaryKey: 'helpGettingStartedSummary',
    points: [
      'helpGettingStartedPointOne',
      'helpGettingStartedPointTwo',
      'helpGettingStartedPointThree',
    ],
  },
  {
    id: 'workspace-overview',
    group: 'start',
    titleKey: 'helpWorkspaceOverviewTitle',
    summaryKey: 'helpWorkspaceOverviewSummary',
    points: [
      'helpWorkspaceOverviewPointOne',
      'helpWorkspaceOverviewPointTwo',
      'helpWorkspaceOverviewPointThree',
    ],
  },
  {
    id: 'camera-navigation',
    group: 'editing',
    titleKey: 'helpCameraTitle',
    summaryKey: 'helpCameraSummary',
    points: ['helpCameraPointOne', 'helpCameraPointTwo', 'helpCameraPointThree'],
  },
  {
    id: 'place-delete-pick-select',
    group: 'editing',
    titleKey: 'helpPlacementTitle',
    summaryKey: 'helpPlacementSummary',
    points: [
      'helpPlacementPointOne',
      'helpPlacementPointTwo',
      'helpPlacementPointThree',
      'helpPlacementPointFour',
    ],
  },
  {
    id: 'undo-redo',
    group: 'editing',
    titleKey: 'helpUndoRedoTitle',
    summaryKey: 'helpUndoRedoSummary',
    points: ['helpUndoRedoPointOne', 'helpUndoRedoPointTwo', 'helpUndoRedoPointThree'],
  },
  {
    id: 'block-browser-quick-bar',
    group: 'editing',
    titleKey: 'helpBlockBrowserTitle',
    summaryKey: 'helpBlockBrowserSummary',
    points: ['helpBlockBrowserPointOne', 'helpBlockBrowserPointTwo', 'helpBlockBrowserPointThree'],
  },
  {
    id: 'decorations-groups',
    group: 'editing',
    titleKey: 'helpDecorationsGroupsTitle',
    summaryKey: 'helpDecorationsGroupsSummary',
    points: [
      'helpDecorationsGroupsPointOne',
      'helpDecorationsGroupsPointTwo',
      'helpDecorationsGroupsPointThree',
    ],
  },
  {
    id: 'blockstate-inspector',
    group: 'inspect',
    titleKey: 'helpInspectorTitle',
    summaryKey: 'helpInspectorSummary',
    points: ['helpInspectorPointOne', 'helpInspectorPointTwo', 'helpInspectorPointThree'],
  },
  {
    id: '3d-y-layer',
    group: 'inspect',
    titleKey: 'helpViewsTitle',
    summaryKey: 'helpViewsSummary',
    points: ['helpViewsPointOne', 'helpViewsPointTwo', 'helpViewsPointThree'],
  },
  {
    id: 'assets-mods',
    group: 'manage',
    titleKey: 'helpAssetsTitle',
    summaryKey: 'helpAssetsSummary',
    points: ['helpAssetsPointOne', 'helpAssetsPointTwo', 'helpAssetsPointThree'],
    noteKey: 'helpAssetsNote',
  },
  {
    id: 'import-export',
    group: 'manage',
    titleKey: 'helpImportExportTitle',
    summaryKey: 'helpImportExportSummary',
    points: ['helpImportExportPointOne', 'helpImportExportPointTwo', 'helpImportExportPointThree'],
    noteKey: 'helpImportExportNote',
  },
  {
    id: 'keyboard-mouse',
    group: 'manage',
    titleKey: 'helpKeyboardMouseTitle',
    summaryKey: 'helpKeyboardMouseSummary',
    points: ['helpKeyboardMousePointOne', 'helpKeyboardMousePointTwo'],
  },
  {
    id: 'settings',
    group: 'manage',
    titleKey: 'helpSettingsTitle',
    summaryKey: 'helpSettingsSummary',
    points: ['helpSettingsPointOne', 'helpSettingsPointTwo', 'helpSettingsPointThree'],
  },
  {
    id: 'troubleshooting',
    group: 'manage',
    titleKey: 'helpTroubleshootingTitle',
    summaryKey: 'helpTroubleshootingSummary',
    points: [
      'helpTroubleshootingPointOne',
      'helpTroubleshootingPointTwo',
      'helpTroubleshootingPointThree',
    ],
  },
];

export function isWorkspaceHelpTopic(value: string | null): value is WorkspaceHelpTopicId {
  return WORKSPACE_HELP_ARTICLES.some((article) => article.id === value);
}

export function workspaceHelpTopic(value: string | null): WorkspaceHelpTopicId {
  return isWorkspaceHelpTopic(value) ? value : 'getting-started';
}
