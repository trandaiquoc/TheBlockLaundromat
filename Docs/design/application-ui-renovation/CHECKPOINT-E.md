# Checkpoint E — Settings and Help

Local implementation evidence, 2026-10-20. This is a checkpoint record, not the
final application renovation acceptance report.

## Changes

- Grouped the shared Settings navigation into Workspace, Input, and Accessibility;
  added a short description for each section and a footer status derived from the
  existing Settings draft. The same Settings component remains mounted by the
  project screen and editor.
- Replaced the narrow two-column navigation with a 44 px section selector while
  keeping grouped navigation on desktop. A localhost check found that the global
  Minecraft theme select rule overrode the component's original touch height;
  the scoped Settings selector now wins that cascade without changing other
  native selects.
- Added a searchable bilingual Help reader with 14 stable topics, grouped desktop
  navigation, a narrow-screen topic selector, and current keyboard/mouse bindings
  from `KeyboardBindingService`.
- Help topic state uses the existing `/editor?help=...` route query. The Guide
  menu opens Getting Started, the existing Controls & Shortcuts command opens the
  live Keyboard and Mouse topic, and browser history changes with topic
  navigation. Closing or pressing Escape removes Help state while preserving the
  editor route and active project.
- Removed the replaced shortcut dialog and its unused static shortcut summary
  after confirming the shell and stylesheet test were its only consumers.

## Verification

- Six focused Angular spec files passed: **83 tests** across Settings, Help
  content/dialog, Editor Chrome, Editor Shell, and theme stylesheet contracts.
- Localhost browser: Settings verified at desktop and 320 px. The narrow section
  selector measured 44 px, fit the viewport, and switched sections. The existing
  draft status changed to Unapplied changes and returned to All changes saved
  after reverting the value.
- Localhost browser: Settings and Help checked in English and Vietnamese across
  Minecraft, Raccoon, Light, and Dark. All 14 topics were present; localized
  topic navigation, query updates, browser Back, close, Escape, and the current
  project remaining in the editor were verified.
- Localhost browser: Help checked at 320 px in Vietnamese and Dark. The close
  control, search, and topic selector fit without horizontal overflow; the
  selector measured 44 px. Screenshots and probes remain in ignored
  `.artifacts/application-ui-renovation/`.

The full suite and production gates remain part of final acceptance after the
remaining checkpoints are complete.
