export type DioramaTarget = 'washer' | 'project-board' | 'courier';
export type DioramaFocus = 'overview' | DioramaTarget;

export type DioramaIntent = { readonly type: 'focus-target'; readonly target: DioramaTarget };

export function intentForSceneTarget(target: DioramaTarget): DioramaIntent {
  return { type: 'focus-target', target };
}
