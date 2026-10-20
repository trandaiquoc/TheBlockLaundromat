# Checkpoint H12 — Item Frame rotation control

The Item Frame inspector now gives its rotation explanation and stepper separate
rows. The two rotation buttons grow from 1.7 rem to 2 rem. The existing item
picker, 45-degree step behavior, advanced controls, placement details and delete
action are unchanged.

Verification: a real Item Frame was placed on a chest in a disposable browser
project, selected, and populated with Diamond. The rotation control fit without
horizontal overflow at 1440 px and in the 390 px inspector sheet. Pressing +
changed its displayed rotation from 0° to 45°. Focused decoration inspector and
painting-picker specs passed (3 tests), and the Angular production build passed.
Painting-specific browser states remain in the H surface audit.
