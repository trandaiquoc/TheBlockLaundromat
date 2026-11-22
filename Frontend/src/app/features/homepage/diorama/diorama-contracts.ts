export type DioramaTarget = 'washer' | 'project-board' | 'raccoon';
export type DioramaFocus = 'overview' | DioramaTarget;

export type DioramaIntent =
  | { readonly type: 'focus-target'; readonly target: DioramaTarget }
  | { readonly type: 'greet-raccoon' };

export function intentForSceneTarget(target: DioramaTarget): DioramaIntent {
  return target === 'raccoon' ? { type: 'greet-raccoon' } : { type: 'focus-target', target };
}
