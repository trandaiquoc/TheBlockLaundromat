# Checkpoint A4 - softer compact catalog action surfaces

Follow-up to the catalog browser review. Grid and List info/Quick Add actions now
show a softly rounded 28 px surface inside their existing 44 px button targets.
Selection, details and Quick Add command semantics remain owned by the existing
catalog item component.

## Verification

- Catalog item Angular/Vitest spec: **7 passed**. The style contract covers the
  28 px surface, semantic radius token and separate 44 px targets.
- Local Chrome 155 with resolved Vanilla assets and a disposable project: Grid
  and List at 420 px; both layouts at 320 px. Button targets measured 44 x 44 px,
  visible surfaces measured 28 x 28 px, and the document had no horizontal
  overflow. Selection remains a separate action.
- Craft, Raccoon, Light and Dark at 320 px kept the same 28 px surface and 44 px
  target. Theme radius tokens resolved to 4, 14, 6 and 6 px respectively.

The full renovation acceptance gate remains in progress; this checkpoint covers
only the catalog action refinement.
