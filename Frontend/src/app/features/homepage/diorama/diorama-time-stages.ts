import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import type { Theme } from '../../../core/ui/theme/theme.service';

export interface DioramaTimeStage {
  readonly theme: Theme;
  readonly timeLabel: TranslationKey;
  readonly themeLabel: TranslationKey;
}

export const dioramaTimeStages: readonly DioramaTimeStage[] = [
  {
    theme: 'light',
    timeLabel: 'dioramaTimeMorning',
    themeLabel: 'themeLight',
  },
  { theme: 'craft', timeLabel: 'dioramaTimeDay', themeLabel: 'themeMinecraft' },
  {
    theme: 'raccoon',
    timeLabel: 'dioramaTimeDusk',
    themeLabel: 'themeRaccoon',
  },
  { theme: 'dark', timeLabel: 'dioramaTimeNight', themeLabel: 'themeDark' },
];

export const dioramaTimeStageIndexByTheme: Readonly<Record<Theme, number>> = {
  light: 0,
  craft: 1,
  raccoon: 2,
  dark: 3,
};

export function dioramaTimeStageIndexAtProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return positiveModulo(Math.floor(progress + 0.5), dioramaTimeStages.length);
}

export function nearestDioramaTimeProgress(progress: number, targetIndex: number): number {
  if (!Number.isFinite(progress) || !Number.isFinite(targetIndex)) return 0;
  const stageCount = dioramaTimeStages.length;
  const currentPhase = positiveModulo(progress, stageCount);
  const normalizedTarget = positiveModulo(Math.round(targetIndex), stageCount);
  let difference = normalizedTarget - currentPhase;
  if (difference > stageCount / 2) difference -= stageCount;
  else if (difference < -stageCount / 2) difference += stageCount;
  return progress + difference;
}

export function dioramaTimeDirectionBetweenThemes(
  fromTheme: Theme,
  toTheme: Theme,
): 'clockwise' | 'counterclockwise' {
  const start = dioramaTimeStageIndexByTheme[fromTheme];
  const destination = dioramaTimeStageIndexByTheme[toTheme];
  return nearestDioramaTimeProgress(start, destination) < start ? 'counterclockwise' : 'clockwise';
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
