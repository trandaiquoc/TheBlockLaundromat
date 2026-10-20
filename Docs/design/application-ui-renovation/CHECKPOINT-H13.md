# Checkpoint H13 — Compact painting picker

The compact Change painting control now exposes its expanded state and panel
relationship. Opening it focuses the search field. Escape closes the picker
without reaching editor shortcuts and restores focus to Change painting;
choosing a painting also returns focus. The expanded catalog picker and painting
selection transactions keep their existing behavior.

Verification: in a disposable local browser project, a 1 × 1 painting was
placed on a block, selected, and changed from Alban to Aztec. The variant grid
fit in the inspector at 390 px and 320 px without horizontal overflow. Chrome
confirmed search focus on open and trigger focus after Escape. Focused painting
browser, picker and inspector tests passed (5 tests); the Angular production
build passed. Cross-theme and other decoration recovery states remain for the
final gate.
