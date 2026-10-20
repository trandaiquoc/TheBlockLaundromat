# Checkpoint A7 - quiet idle actions and fixed catalog targets

Grid and List info/Quick Add controls now keep a transparent idle face and show
a 16 px theme-rounded surface on hover or keyboard focus. Each target stays
44 × 44 px at Small, Normal and Large UI font settings. Details and Quick Add
commands remain separate from material selection.

## Verification

- Focused catalog component tests cover the 16 px surface, transparent idle,
  visible focus feedback, fixed 44 px target and existing action semantics.
- The focused Angular test target passed: **7 tests**. The browser check covered
  Grid and List in Minecraft, Raccoon, Light and Dark at 420 × 840 and
  1440 × 1000 CSS px with Large UI text. All 16 combinations measured a
  transparent idle face, 16 × 16 px surface and 44 × 44 px target, with no
  horizontal overflow. Theme radius tokens remained active.
- Browser keyboard focus showed the existing 2 px focus ring and compact face;
  pointer hover showed the theme-tinted 16 px face. Selection, details and Quick
  Add command behavior remain covered by the component spec.
- Narrow screenshots: `.artifacts/catalog-feedback-a7-grid-dark-420x840.png`
  and `.artifacts/catalog-feedback-a7-list-dark-420x840.png`.

The full renovation acceptance gate remains in progress; this checkpoint covers
only the catalog action refinement.
