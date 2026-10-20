# Checkpoint H1 — Viewport axes and Y-layer controls

Implemented 2026-10-20 as the first viewport presentation slice. The 3D grid has
a compact Blender-inspired six-direction XYZ gizmo whose projected axes follow
camera orbit. Its axis presets frame the whole structure even when a block is
selected. The gizmo is hidden in Y-Layer. The bilingual Camera navigation help
topic documents these behaviors and clarifies that selection does not alter
block data.

The Y-Layer value and previous/next controls read as one stepper, with the Y
label integrated into the value group. Project dimensions remain in the lower
status bar; live voxel coordinates appear in the upper viewport feedback only.

Focused follow-up tests passed (24 passed). The full suite passed (2,139 passed,
11 skipped). Production build, tool tests (2), encoding check, Prettier check and
`git diff --check` passed.

Local browser QA at 780 × 437 confirmed orbit moves the gizmo endpoints, the
gizmo is hidden with Y-Layer active, and the lower status bar has no duplicate
coordinate readout. Earlier H1 browser checks at 1,600 × 900 verified all six
camera directions, theme axis colors and catalog refinements. Temporary review
captures were kept under `/tmp` and are not project artifacts.
