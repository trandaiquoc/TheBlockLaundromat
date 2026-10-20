import { describe, expect, it } from 'vitest';
import {
  MAX_STRUCTURE_JSON_FILE_BYTES,
  structureJsonFileIssue,
} from './structure-json-file-policy';

describe('Structure JSON file policy', () => {
  it('accepts JSON at the limit and rejects wrong formats or oversized input', () => {
    expect(
      structureJsonFileIssue({ name: 'build.JSON', size: MAX_STRUCTURE_JSON_FILE_BYTES }),
    ).toBeUndefined();
    expect(structureJsonFileIssue({ name: 'build.zip', size: 2 })).toBe('type');
    expect(
      structureJsonFileIssue({ name: 'build.json', size: MAX_STRUCTURE_JSON_FILE_BYTES + 1 }),
    ).toBe('size');
  });
});
