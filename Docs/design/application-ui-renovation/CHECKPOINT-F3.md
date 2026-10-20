# Checkpoint F3 — Structure JSON file and review feedback

Local implementation evidence, 2026-10-20. This is a focused input checkpoint;
the remaining Structure JSON modes and exceptional branches remain in F.

- The existing Structure JSON picker checks the `.json` extension and a 64 MiB
  file limit before reading, with localized actionable errors. Selecting a new
  file invalidates any old preview/Apply plan immediately, including when the
  selected file fails these checks.
- The chosen file name appears beside the source status. Source messages share
  one bounded status row so they do not displace the JSON editor grid track.
- After Validate completes with a preview, focus moves to the review pane;
  keyboard users and narrow-screen users reach the new results directly.
  Validation/parsing/planning and atomic Apply remain owned by the existing
  workflow.

The 13 targeted dialog tests passed, including extension/size rejection,
stale-preview clearing and focus after validation. Localhost at 390 px
confirmed wrong-file feedback, valid file name, review focus, no horizontal
overflow and no page errors.
