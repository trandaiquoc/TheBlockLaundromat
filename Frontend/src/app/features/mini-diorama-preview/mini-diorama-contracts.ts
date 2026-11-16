export type MiniDioramaTarget = 'washer' | 'project-board' | 'raccoon';
export type MiniDioramaFocus = 'overview' | MiniDioramaTarget;

export type MiniDioramaIntent =
  | { readonly type: 'focus-target'; readonly target: MiniDioramaTarget }
  | { readonly type: 'greet-raccoon' };

export function intentForSceneTarget(target: MiniDioramaTarget): MiniDioramaIntent {
  return target === 'raccoon' ? { type: 'greet-raccoon' } : { type: 'focus-target', target };
}
