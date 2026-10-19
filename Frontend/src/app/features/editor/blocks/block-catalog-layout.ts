export type BlockCatalogView = 'grid' | 'list';

export const BLOCK_CATALOG_ROW_HEIGHT = 56;
export const BLOCK_CATALOG_GRID_ROW_REM = 12;
const GRID_CARD_MIN_WIDTH_REM = 8;
const GRID_COLUMN_GAP_REM = 0.5;
const LIST_ROW_REM = 3.5;

export function catalogColumns(width: number, fontSize: number, view: BlockCatalogView): number {
  return view === 'list'
    ? 1
    : Math.max(
        1,
        Math.floor(
          (width + fontSize * GRID_COLUMN_GAP_REM) /
            (fontSize * (GRID_CARD_MIN_WIDTH_REM + GRID_COLUMN_GAP_REM)),
        ),
      );
}

export function catalogRowHeight(fontSize: number, view: BlockCatalogView): number {
  return view === 'list'
    ? Math.max(BLOCK_CATALOG_ROW_HEIGHT, fontSize * LIST_ROW_REM)
    : fontSize * BLOCK_CATALOG_GRID_ROW_REM;
}

/** Only row indices are allocated. Item objects stay in the authoritative search result. */
export function catalogRowIndices(itemCount: number, columns: number): readonly number[] {
  return Array.from({ length: Math.ceil(itemCount / columns) }, (_, index) => index);
}

export function catalogKeyboardTarget(
  key: string,
  index: number,
  columns: number,
  count: number,
): number | undefined {
  if (!count) return undefined;
  let target: number;
  switch (key) {
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    case 'ArrowRight':
      target = index + 1;
      break;
    case 'ArrowLeft':
      target = index - 1;
      break;
    case 'ArrowDown':
      target = index + columns;
      break;
    case 'ArrowUp':
      target = index - columns;
      break;
    default:
      return undefined;
  }
  return Math.max(0, Math.min(count - 1, target));
}
