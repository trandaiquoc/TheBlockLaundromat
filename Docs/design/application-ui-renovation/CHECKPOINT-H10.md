# Checkpoint H10 — Inventory inspector

The selected slot editor now has a subtle divider from the slot grid, and its
Clear item action uses the shared secondary button. The existing 27-slot chest
grid, item picker, count validation, transactions and locked state remain.

Verification: in a disposable local browser project, a real chest was placed
and selected. Its 27-slot grid had no horizontal overflow at 1440 px or in the
390 px inspector sheet. The item picker opened above its trigger near the
viewport bottom, selecting Diamond populated slot 1, changing its count to 12
updated the input, and Clear item returned it to empty. Focused inventory and
dropdown specs passed (16 tests); the Angular production build passed.
