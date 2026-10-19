import { describe, expect, it } from 'vitest';
import {
  catalogColumns,
  catalogRowHeight,
  catalogRowIndices,
  catalogKeyboardTarget,
} from './block-catalog-layout';

describe('block catalog layout', () => {
  it('keeps compact list rows and groups responsive grids into complete virtual rows', () => {
    expect(catalogColumns(304, 16, 'grid')).toBe(2);
    expect(catalogColumns(450, 16, 'grid')).toBe(3);
    expect(catalogColumns(220, 18, 'grid')).toBe(1);
    expect(catalogColumns(600, 16, 'list')).toBe(1);
    expect(catalogRowHeight(16, 'list')).toBe(56);
    expect(catalogRowHeight(18, 'list')).toBe(63);
    expect(catalogRowHeight(18, 'grid')).toBe(216);
    expect(catalogRowIndices(7, 3)).toEqual([0, 1, 2]);
    expect(catalogRowIndices(0, 2)).toEqual([]);
    const rows = catalogRowIndices(100_001, 3);
    expect(rows).toHaveLength(33_334);
    expect(rows.at(-1)! * 3 + 1).toBe(100_000);
  });
  it('navigates the logical catalog across virtual row boundaries and clamps partial rows', () => {
    expect(catalogKeyboardTarget('ArrowDown', 2, 3, 10000)).toBe(5);
    expect(catalogKeyboardTarget('ArrowRight', 2, 3, 10000)).toBe(3);
    expect(catalogKeyboardTarget('ArrowUp', 2, 3, 10000)).toBe(0);
    expect(catalogKeyboardTarget('ArrowDown', 6, 3, 7)).toBe(6);
    expect(catalogKeyboardTarget('End', 0, 3, 10000)).toBe(9999);
    expect(catalogKeyboardTarget('Home', 9999, 1, 10000)).toBe(0);
    expect(catalogKeyboardTarget('Enter', 0, 2, 4)).toBeUndefined();
    expect(catalogKeyboardTarget('End', 0, 2, 0)).toBeUndefined();
  });
});
