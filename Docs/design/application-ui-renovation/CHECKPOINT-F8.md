# Checkpoint F8 — Project Screen Structure JSON recovery

Local implementation evidence, 2026-10-20. The import parser, project
construction and persistence contract are unchanged.

The Project Screen Structure JSON dialog now closes on Escape and returns focus
to its Create from Structure JSON trigger. The existing import workflow remains
the owner of file reading, parsing, validation, stale-work cancellation and
project persistence.

The workflow spec now covers invalid file type and size before reading, read
failure followed by successful retry, malformed JSON, empty input, negative
coordinates, dimensions beyond Huge Structure Blocks, project creation,
persistence failure, stale reads and a close attempt during a save. The
project-import preparation spec verifies the 48/49 block boundary and
unresolved block/decorations preservation.

Localhost checks used a disposable Chrome profile and files in ignored
`.artifacts/`. At 320 px, malformed JSON showed a localized alert and disabled
Create button with no horizontal overflow. At 1440 px, a 49 × 1 × 1 preview
required an explicit **Use Huge Structure Blocks & Create** action. Cancel
left the project list unchanged; confirming created the project with one block.
After reload, the project remained in the list with its 49 × 1 × 1 size.

Escape closed the import dialog and restored focus to its trigger at 320 px. The
parse-error dialog was also checked at 320 px in Minecraft, Raccoon, Light and
Dark, then in Vietnamese; each retained the error message without page overflow.
