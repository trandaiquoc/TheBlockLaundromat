# Checkpoint A6 - smaller catalog action surfaces

The info and Quick Add faces in Grid and List shrink from 22 px to 18 px. Their
44 px button targets, icon size, theme radius, hover and keyboard focus remain
unchanged, so the visible controls read more quietly without reducing access.

## Verification

- Catalog item spec protects the 18 px face, semantic radius, borderless idle
  surface and independent 44 px target.
- Current localhost browser check: Grid and List in Minecraft, Raccoon, Light
  and Dark at 1440 x 1000 and 420 x 840 CSS px measured 18 x 18 px faces and
  44 x 44 px targets. None of the 16 combinations overflowed horizontally.
- Existing interaction tests cover separate selection, details and Quick Add
  actions, accessible names, and capacity-disabled behavior.

The full renovation acceptance gate remains in progress; this checkpoint covers
only the catalog action refinement.
