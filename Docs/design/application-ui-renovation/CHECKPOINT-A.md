# Checkpoint A — catalog actions and Quick Bar

Local implementation evidence, 2026-10-20. This is a checkpoint record, not the
final application renovation acceptance report.

## Changes

- Grid/List information and Quick Add actions share quiet 28 px surfaces inside
  independent 44 px targets. Grid groups actions below the preview, leaving the
  material selection button separate. Details and Quick Add retain their commands.
- A check beside the active name and a leading edge marker strengthen Light/Dark
  selection. Raccoon uses softer card/preview shapes and matte Quick Bar controls;
  the canonical palette, renderer and block colors are unchanged.
- Quick Bar owns one connected full-name/item-ID tooltip, with hover, keyboard
  and touch activation, viewport bounds, pointer travel, Escape/outside dismissal
  and lifecycle cleanup. It reads canonical entries and adds no thumbnail work.

## Verification

- Four targeted spec files: **27 tests passed**, covering catalog selection,
  details, Quick Add identity/capacity, clipboard recovery, Quick Bar services and
  tooltip focus, Escape, pointer dismissal, tap selection, removal, collapse and
  teardown. No renderer/hot-path changes were made.
- Localhost with real Vanilla/Cobblemon resources: Grid/List in Minecraft,
  Raccoon, Light and Dark; independent target measurements (44 px), 28 px visual
  surface, selected check and pressed state. Real Quick Add and full-name hover.
- Vietnamese at 320/390 px: both layouts, targets inside cards without overlapping
  selection, item details/Escape, actual emulated touch selection, tooltip within
  viewport, full text and Escape dismissal. Test project/profile only.
- Production build, app typecheck and encoding checks are run before commit.
  The final goal still requires the full suite and remaining checkpoints.

Source coverage was inventoried before editing in
[UI-SURFACE-INVENTORY.md](UI-SURFACE-INVENTORY.md). The current behavior contract is
[Block Browser Grid/List](../workspace-renovation/BLOCK-BROWSER-GRID-LIST.md).
