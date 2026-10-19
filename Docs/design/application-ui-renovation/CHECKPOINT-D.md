# Checkpoint D — shared dialogs and overlays

Local implementation evidence, 2026-10-20. This is a checkpoint record, not the
final application renovation acceptance report.

## Changes

- Localized DialogService fallback actions and the alert close label in English
  and Vietnamese. Alert content now has an explicit accessible description,
  its close and action controls meet the 44 px touch target, and footer actions
  can wrap at narrow widths.
- Kept initial focus inside newly opened alerts and restored focus to the
  previously active control after close. Escape now stops at the active alert.
- Fixed the nested Settings discard regression: the alert handled Escape but
  allowed it to bubble to Settings' document-level Escape handler. That handler
  immediately requested close again and opened another discard alert, making
  the first one appear not to close. The alert now stops propagation after
  handling Escape; Settings draft and discard semantics are unchanged.
- Added a shared connected-overlay position contract for themed and searchable
  selectors. They can choose above or below the trigger, honor viewport margins,
  focus search only after attachment, and expose 44 px controls on coarse
  pointers. The Y-Layer/Craft select override now preserves the touch target.
- Gave the bounded read-only code region its accessible name at the scrollable
  region itself. Source selection, item identities and catalog ownership remain
  unchanged.

## Verification

- Six focused shared UI spec files passed: **37 tests**. This includes nested
  focus ownership, Escape propagation, focus restoration, connected-overlay
  focus, and accessible code-region naming.
- Localhost browser: About dialog checked in Minecraft, Raccoon, Light and Dark
  at 390 px and 320 px, in Vietnamese, with touch emulation. All dialogs fit the
  viewport; localized labels, descriptions and 44 px close/action targets were
  present.
- Localhost browser: item picker at 320 px with touch emulation. Source controls,
  search and options measured 44 px; the popup stayed above its trigger inside
  the viewport, Escape closed only the popup, and focus returned to the picker.
- Localhost browser: Settings themed select at 320 × 420 px. Trigger and options
  measured 44 px; the popup stayed within the viewport and Escape left Settings
  open.
- Localhost browser: changed a Settings draft, opened its discard confirmation,
  used Escape to cancel that confirmation, then reopened it and discarded the
  draft. The child closed without reopening itself; Settings remained open after
  Cancel, and the discarded value was not persisted.

The broader application suite and production gates remain part of final
acceptance, after the remaining checkpoints are complete.
