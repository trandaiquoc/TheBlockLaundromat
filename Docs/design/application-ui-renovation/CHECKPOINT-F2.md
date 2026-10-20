# Checkpoint F2 — Structure JSON export intent

Local implementation evidence, 2026-10-20. This covers the existing Structure
JSON export dialog, not the remaining import/export flows.

The export dialog had one tab with no alternate panel and a Save changes action
that only updated a local dialog snapshot. It could be mistaken for saving the
project. The dialog now presents one JSON editor with an explicit export-only
explanation, Original snapshot / Edited draft status, Revert edits, and a
download choice between original and edited JSON. Downloading edits preserves
the original snapshot in the dialog. The ProjectDocument and file format are
unchanged. Unused tab logic and styles were removed after consumer inspection.

The metadata pane is keyboard-scrollable, and the narrow layout keeps its
details in a bounded region. Targeted component tests cover initial actions,
draft/revert, both download choices and nested focus. Localhost at 390 px
confirmed no horizontal overflow, no tab, visible export-only guidance and a
real original JSON download from an invalid draft.
