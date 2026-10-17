import { describe, expect, it } from 'vitest';
import { shouldClearInteractionFeedbackForToolChange } from './viewport-interaction-feedback';

describe('viewport interaction feedback lifecycle', () => {
  it('retains feedback when the active tool is unchanged', () => {
    expect(shouldClearInteractionFeedbackForToolChange('place', 'place')).toBe(false);
  });

  it('clears feedback when the active tool changes or is first observed', () => {
    expect(shouldClearInteractionFeedbackForToolChange('place', 'select')).toBe(true);
    expect(shouldClearInteractionFeedbackForToolChange(undefined, 'place')).toBe(true);
  });
});
