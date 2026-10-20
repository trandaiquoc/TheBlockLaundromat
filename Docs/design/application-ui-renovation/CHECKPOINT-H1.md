# Checkpoint H1 — Viewport axes and Y-layer controls

Implemented 2026-10-20 as the first viewport presentation slice. The 3D grid
now has a compact Blender-inspired six-direction XYZ gizmo at the left edge.
Its X/Y/Z colors come from shared semantic tokens tuned per theme. Each endpoint
uses the existing camera preset API; positive and negative Y select top and
bottom views, with Minecraft Y remaining vertical. No project coordinates or
second camera state are introduced.

The Y-Layer value and previous/next controls now read as one stepper. The Y axis
label sits inside the value group instead of becoming a separate badge. Status
coordinates and project dimensions show X/Y/Z as aligned, separately colored
values.

Focused tests passed, including a 23-test camera/gizmo/Y-Layer/theme run and a
48-test catalog/status/theme integration run (the runs overlap). Full suite
passed (2,137 passed, 11 skipped);
the initial full run exposed a missing `ProjectBackupWorkflow` test double in
the Project Screen spec, which was added and verified. Production build, tool
tests (2), encoding check, Prettier check and `git diff --check` passed.

Local browser QA at 1,600 × 900 verified the compact Y stepper (162 × 46 px),
centered catalog names, active card marker, no horizontal document overflow,
and all six camera directions producing distinct viewport images. Runtime axis
tokens were checked in Craft, Light, Raccoon and Dark; tests verify each axis
color meets 4.5:1 against header and raised surfaces. Temporary review captures
were kept under `/tmp` and are not project artifacts.
