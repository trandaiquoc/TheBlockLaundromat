# Checkpoint A5 - smaller, quieter catalog action surfaces

The latest review found the 28 px info and Quick Add surfaces still too large.
Grid and List now use a 22 px softly rounded surface with a lower-contrast idle
fill, centered within the existing 44 px button targets. Hover feedback, focus,
keyboard access, and catalog command semantics remain unchanged.

## Verification

- Catalog item spec: **7 passed**. Its style contract protects the 22 px
  surface, theme radius token, borderless appearance and independent 44 px target.
- Local Chrome 155: Grid at 1440 × 1000 in Dark and List at 420 × 840 in Raccoon
  both measured 22 × 22 px visible surfaces and 44 × 44 px targets.
- At 320 px, Grid and List in Craft, Raccoon, Light and Dark each kept the 22 px
  surface and 44 px target. None of the eight combinations overflowed
  horizontally. Radius tokens remained theme-specific (4, 14 or 6 px).
- Existing interaction tests still cover independent material selection,
  details, Quick Add, accessible labels and capacity-disabled state.

The full renovation acceptance gate remains in progress; this checkpoint covers
only the catalog action refinement.
