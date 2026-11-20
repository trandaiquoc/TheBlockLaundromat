import type { TranslationKey } from '../../core/ui/localization/translation-catalogs';
import type { Theme } from '../../core/ui/theme/theme.service';

export interface MiniDioramaTimeStage {
  readonly theme: Theme;
  readonly timeLabel: TranslationKey;
  readonly themeLabel: TranslationKey;
}

export const miniDioramaTimeStages: readonly MiniDioramaTimeStage[] = [
  {
    theme: 'light',
    timeLabel: 'miniDioramaTimeMorning',
    themeLabel: 'themeLight',
  },
  { theme: 'craft', timeLabel: 'miniDioramaTimeDay', themeLabel: 'themeMinecraft' },
  {
    theme: 'raccoon',
    timeLabel: 'miniDioramaTimeDusk',
    themeLabel: 'themeRaccoon',
  },
  { theme: 'dark', timeLabel: 'miniDioramaTimeNight', themeLabel: 'themeDark' },
];

export const miniDioramaTimeStageIndexByTheme: Readonly<Record<Theme, number>> = {
  light: 0,
  craft: 1,
  raccoon: 2,
  dark: 3,
};

export function miniDioramaTimeStageIndexAtProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return positiveModulo(Math.floor(progress + 0.5), miniDioramaTimeStages.length);
}

export function nearestMiniDioramaTimeProgress(progress: number, targetIndex: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(targetIndex)) return 0;
  const stageCount = miniDioramaTimeStages.length;
  const currentPhase = positiveModulo(progress, stageCount);
  const normalizedTarget = positiveModulo(Math.round(targetIndex), stageCount);
  let difference = normalizedTarget - currentPhase;
  if (difference > stageCount / 2) difference -= stageCount;
  else if (difference < -stageCount / 2) difference += stageCount;
  return progress + difference;
}

export function miniDioramaTimeDirectionBetweenThemes(
  fromTheme: Theme,
  toTheme: Theme,
): 'clockwise' | 'counterclockwise' {
  const start = miniDioramaTimeStageIndexByTheme[fromTheme];
  const destination = miniDioramaTimeStageIndexByTheme[toTheme];
  return nearestMiniDioramaTimeProgress(start, destination) < start
    ? 'counterclockwise'
    : 'clockwise';
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
