# Checkpoint B — Reality and shared Settings state

Reality ground and sky configuration remains visible under Appearance →
Workspace Background regardless of the selected background. The status reads the
canonical persisted preference and the existing Settings draft; it does not own
a second value or affect the renderer. It displays the applied/saved mode and
Reality presets separately from pending draft values. Apply and Save & Close
retain the existing `SettingsDialogSession` commit path. Opening or canceling
Settings leaves the applied workspace environment unchanged.

## Verification

- Settings component/session and preferences targeted specs pass. The component
  regression covers default Dark + Plains Grass + Overworld Day, discoverable
  Reality controls while Dark is active, draft preset/background status, Apply,
  and Cancel/discard preserving the previously applied preferences.
- Localhost verification uses the same Settings owner from Homepage and Workspace.
  It checks saved defaults, Reality visibility while Dark is active, draft changes,
  cancellation without a renderer background change, and Apply through the UI.
- The status text measured above 8:1 contrast in Minecraft, Raccoon, Light and
  Dark. EN/VI presets and status were verified in the browser.
- At 320 and 390 px there is no horizontal overflow; Reality content scrolls
  above the visible Settings footer. The current footer controls are 36 px high;
  the E Settings pass will improve their touch size.
- Settings targeted specs: **47 passed**. Production build, app typecheck,
  encoding check and scoped Prettier passed. Full suite remains a final-goal gate.
