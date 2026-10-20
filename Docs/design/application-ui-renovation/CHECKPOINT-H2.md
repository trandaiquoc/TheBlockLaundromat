# Checkpoint H2 — Signed viewport gizmo and compact Quick Bar

Implemented 2026-10-20 from the user's follow-up. The shared XYZ gizmo now sits
at the upper-right of both 3D and Y-Layer viewports. Its compact endpoints show
signed axis labels (`+X`/`−X`, `+Y`/`−Y`, `+Z`/`−Z`), use the semantic axis colors,
and continue to project from the current camera orientation. Geometry, sizing,
and placement remain the same in all four themes; semantic theme tokens supply
the axis and surface colors. Axis clicks use the existing camera preset path,
which targets the full structure bounds and keeps Minecraft Y vertical. Top and
bottom presets retain the normal Y-up orbit orientation with a tiny offset from
the exact pole, so manual orbit can move back toward a perspective view without
resetting the camera.

Viewport feedback and the X/Y/Z coordinates now render in separate compact
chips with visible spacing. Each coordinate uses its matching axis color. The
lower status bar continues to omit duplicate hover coordinates.

The Quick Bar no longer opens a visible material-name popup on hover or focus.
Its buttons keep their full material name and item ID in their accessible name.

Focused component/camera tests passed (16 tests across the gizmo, feedback, Quick
Bar and camera specs); the full suite passed (2,139 tests, 11 skipped). App
typecheck, production build, encoding and Prettier checks passed.

Final browser QA used a disposable local Chrome profile and a new 16 × 16 × 16
test project. Minecraft, Raccoon, Light and Dark each rendered the same 64px
signed gizmo geometry. The active 3D and Y-Layer sessions exposed the shared
controls; the Dark Y-Layer view was visually inspected. With a selected block,
the Dark 3D status and coordinate chips had an 8px gap, and computed X/Y/Z
colors were distinct. Clicking Bottom, then dragging the camera manually,
changed the gizmo projection without Reset. Captures stayed in `/tmp` only.
