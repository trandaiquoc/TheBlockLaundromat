# Checkpoint H4 — Status and coordinates across themes

The status label and live X/Y/Z coordinates now read as separate chips more
clearly. Their desktop gap is 16 px and narrow-width gap is 12 px. The status
chip uses a light semantic tint and border for valid, warning, unknown and
invalid states; the coordinate chip keeps the neutral floating surface and
axis-colored values.

The shared gizmo keeps the same 64 px geometry and six signed controls across
Minecraft (Craft), Raccoon, Light and Dark. Its surface, border and axis colors
continue to come from semantic theme tokens, and the same component is used in
3D and Y-Layer.

Verification:

- The focused feedback component spec passed (3 tests); app production build
  passed.
- At desktop viewport size, browser measurements confirmed the 16 px gap, a
  semantically tinted status chip, neutral coordinate surface and 64 px gizmo
  in all four themes.
- At 390 px in Light/Y-Layer, the status and coordinates had a 12 px gap, fit
  within the viewport, and the shared six-control gizmo remained visible.
- Frontend encoding, scoped Prettier and `git diff --check` passed. Review
  captures stayed in `/tmp` and were not added to the repository.
