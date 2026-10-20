# Checkpoint A2 — Catalog actions and shared active states

Local implementation evidence, 2026-10-20. Catalog card actions now balance
the details/info target on the left and Quick Add on the right, while keeping
the existing 44 px hit areas and centered details layout. Selected cards use the
same selected surface and an inset marker using the focus semantic token across
themes; there is no Light-only outline. Grid-card names are centered, with the
active marker positioned independently so it does not offset the text. Idle,
hover and keyboard focus styles remain separate.

The catalog item, Block Browser and theme token tests passed (33 tests). The
theme contract checks at least 3:1 contrast for the shared focus-token selected
marker against each selected surface. Localhost at 1600 × 900 showed balanced
info/add actions, centered grid names, the same selected treatment in Light and
Dark, and no document overflow. The viewport-axis work is recorded in
[H1 — XYZ gizmo and Y-Layer stepper](CHECKPOINT-H1.md).
