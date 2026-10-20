# Checkpoint F1 — Project Backup import/export

Local implementation evidence, 2026-10-20. This is a checkpoint record, not
final acceptance for all import/export workflows.

## Change and contract

- The Project Screen now has an Import Project Backup action and an Export
  Backup action on each saved project. The existing versioned project-package
  parser and serializer remain authoritative; no file format changed.
- Import checks `.json` and a 64 MiB file limit before reading, validates and
  migrates through the existing package parser, then previews project name,
  Minecraft version, dimensions, blocks and decorations before persistence.
- If the backup ID already exists, the UI explains that restore creates a
  separate copy. The workflow rechecks at commit time and never overwrites the
  existing project. A cancelled read cannot publish a stale preview.
- Export reads the saved project and downloads a local `.tbl-project.json`
  package. It does not alter the editor, active project or preferences.
- The Help import/export topic now describes existing NBT export and this
  Project Screen backup flow, and identifies NBT import as unsupported.

## Verification

- Targeted workflow tests cover package round trip, duplicate ID preservation,
  invalid JSON, storage failure, wrong file type and stale read cancellation.
- Localhost browser: at 390 px the dialog fits in all four themes with no page
  overflow. English and Vietnamese labels render. Real file restore, backup
  download and duplicate restore produced two project rows with the original
  still present; no page errors appeared.

Remaining checkpoint F work: Structure JSON import/export, external AI tabs,
NBT/datapack export and all associated nested/error branches.
