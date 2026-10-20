# Checkpoint H8 — Larger shared axis gizmo

The shared XYZ gizmo is 72 px at the normal UI font size, up from 64 px. Its
signed-axis buttons and labels grow proportionally. Axis centers and lines now
use percentages of the gizmo frame, so they stay aligned when a larger UI font
size scales the frame. The same component serves 3D and Y-Layer and keeps the
existing camera preset interactions and semantic theme colors.

Verification:

- Focused gizmo component spec passed (2 tests) and the Angular production build
  passed.
- Browser checks measured the visible gizmo at 72 × 72 px in both 3D and
  Y-Layer at 390 px and 320 px viewport widths. Every axis button stayed inside
  the gizmo and the viewport.
- Minecraft, Raccoon, Light and Dark retained the same 72 px geometry with
  their semantic axis colors. At a 20 px root font size, the frame scaled to
  90 px with all buttons still inside it.
- Selecting +X in 3D changed the camera orientation. Desktop and narrow visual
  captures remained in `/tmp` and were not added to the repository.
- Scoped Prettier, encoding and `git diff --check` passed.
