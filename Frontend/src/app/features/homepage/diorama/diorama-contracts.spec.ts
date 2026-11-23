import { describe, expect, it } from 'vitest';
import { intentForSceneTarget } from './diorama-contracts';

describe('intentForSceneTarget', () => {
  it('routes washer and board selections as focus intents', () => {
    expect(intentForSceneTarget('washer')).toEqual({ type: 'focus-target', target: 'washer' });
    expect(intentForSceneTarget('project-board')).toEqual({
      type: 'focus-target',
      target: 'project-board',
    });
  });

  it('routes Courier selection as a focus intent', () => {
    expect(intentForSceneTarget('courier')).toEqual({ type: 'focus-target', target: 'courier' });
  });
});
