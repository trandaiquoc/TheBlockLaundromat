# Checkpoint H3 — Separated feedback and themed gizmo surfaces

Implemented 2026-10-20 from the user's visual follow-up. Placement feedback and
the live X/Y/Z readout now have a 12px gap on desktop and an 8px gap at narrow
widths. Both chips use the shared floating surface and border tokens so they
read as separate pieces while retaining the current theme's material.

The six shared axis controls use the same floating raised surface, semantic
border and control shadow as the rest of the UI. X, Y and Z retain their
theme-specific semantic colors. Hover and pressed states use shared surface
tokens. The same component remains in the 3D and Y-Layer viewports.

Verification:

- Focused viewport feedback and gizmo specs passed (5 tests).
- App typecheck and production build passed.
- Browser QA used a disposable local project. Craft, Raccoon, Light and Dark
  produced the same 64px gizmo geometry with distinct token-driven axis colors.
- In 3D and Y-Layer, the status and coordinate chips remained separate. Browser
  measurements confirmed a 12px desktop gap and an 8px gap at 390px width; the
  controls stayed within the viewport. Y-Layer exposed the same six gizmo axes.
- Visual captures were temporary files under `/tmp`; no QA assets were added to
  the repository.
