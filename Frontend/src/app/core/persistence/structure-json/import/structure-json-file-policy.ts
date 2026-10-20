export const MAX_STRUCTURE_JSON_FILE_BYTES = 64 * 1024 * 1024;

export type StructureJsonFileIssue = 'type' | 'size';

/** Browser picker accept attributes are hints, so both entry points check files here. */
export function structureJsonFileIssue(
  file: Pick<File, 'name' | 'size'>,
): StructureJsonFileIssue | undefined {
  if (!file.name.toLowerCase().endsWith('.json')) return 'type';
  if (file.size > MAX_STRUCTURE_JSON_FILE_BYTES) return 'size';
  return undefined;
}
