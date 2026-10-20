# Checkpoint H9 — Decorated Pot inspector

The Decorated Pot inspector now separates the four sherd pattern choices from
the stored item editor. The sherd controls use one column when the inspector is
narrower than 18 rem, so the searchable controls retain usable width. The stored
item picker receives the same EN/VI visual-status labels as other item pickers,
and Clear item uses the shared secondary button treatment.

The existing pot data, editor transactions, locked state, count validation and
raw-data warning remain owned by the existing component and services.

Verification: focused Decorated Pot and item-picker tests passed (9 tests), and
the Angular production build passed. A real Decorated Pot was placed and selected
in a disposable browser project. The inspector remained readable at 1440 px and
in the 390 px inspector sheet, with no horizontal overflow. Screenshots stayed
in `/tmp` and were not added to the repository. EN and the other themes remain
for the final cross-theme gate.
