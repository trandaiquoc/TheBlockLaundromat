import type { EditorSettings } from './project.types';

export const DEFAULT_REFERENCE_LAYER_OPACITY = 0.15;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  currentY: 0,
  layerVisibility: 'current-only',
  referenceLayerOpacity: DEFAULT_REFERENCE_LAYER_OPACITY,
};
