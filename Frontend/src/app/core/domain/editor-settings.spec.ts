import { describe, expect, it } from 'vitest';
import { DEFAULT_EDITOR_SETTINGS, DEFAULT_REFERENCE_LAYER_OPACITY } from './editor-settings';

describe('editor settings defaults', () => {
  it('uses fifteen percent reference opacity for new projects and missing preferences', () => {
    expect(DEFAULT_REFERENCE_LAYER_OPACITY).toBe(0.15);
    expect(DEFAULT_EDITOR_SETTINGS).toEqual({
      currentY: 0,
      layerVisibility: 'current-only',
      referenceLayerOpacity: 0.15,
    });
  });
});
