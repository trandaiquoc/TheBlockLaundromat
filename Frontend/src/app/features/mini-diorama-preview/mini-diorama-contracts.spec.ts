import { describe, expect, it } from 'vitest';
import { intentForSceneTarget } from './mini-diorama-contracts';

describe('intentForSceneTarget', () => {
  it('routes washer and board selections as focus intents', () => {
    expect(intentForSceneTarget('washer')).toEqual({ type: 'focus-target', target: 'washer' });
    expect(intentForSceneTarget('project-board')).toEqual({
      type: 'focus-target',
      target: 'project-board',
    });
  });

  it('routes raccoon selection as a greeting intent', () => {
    expect(intentForSceneTarget('raccoon')).toEqual({ type: 'greet-raccoon' });
  });
});
