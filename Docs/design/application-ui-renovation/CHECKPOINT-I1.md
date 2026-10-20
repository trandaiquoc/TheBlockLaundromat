# Checkpoint I1 — Saved JSON download recovery

Local root-cause evidence, 2026-10-20. This is a separate correctness fix from
checkpoint F presentation work.

The export dialog's `download()` validated the current draft before showing the
dirty-download choice. An invalid draft therefore blocked access to the valid
saved snapshot, even though the guard offered a Download saved option. The
dialog now opens the choice for any dirty draft, and validates only the version
the user selects. Project data, history and file formats are unchanged.

The regression spec covers invalid draft → guard → saved snapshot download,
and the existing valid-draft/focus tests still pass. A localhost browser check
confirmed a real `.structure.json` download from this path.
