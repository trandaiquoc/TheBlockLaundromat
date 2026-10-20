# Checkpoint A3 — Smaller, quieter catalog actions

Follow-up to user review of the Grid/List catalog actions. The `i` and `+`
surfaces are now 1.125 rem (18 px at normal font size) and borderless on hover,
while their independent button targets remain at least 44 px. Their shared item
component keeps placement, selection and Quick Add command semantics unchanged.

## Verification

- Targeted catalog item tests: **7 passed**.
- Local Chrome 155: Grid at 1600 px and List in the 320 px Blocks drawer both
  measured 44 × 44 px action targets and zero overlap with material selection.
  The 320 px document had no horizontal overflow. Quick Add added items without
  changing the active material; selecting a material retained its active marker.
- At the large-font root size (18 px), Grid remained inside the 320 px drawer:
  targets measured 49.5 px, surfaces 20.25 px, with no overlap or horizontal
  overflow.
- Craft, Raccoon, Light and Dark all retained the same normal-size surface,
  transparent border, and clear selected marker. Hover increased the quiet fill
  without drawing an outline.
- `npm run build`, app/spec TypeScript checks, encoding check, Prettier and
  `git diff --check` passed.

Screenshots: [desktop Grid / Craft](evidence/20261020-catalog-actions-a3/grid-craft-desktop.png)
and [320 px List / Dark](evidence/20261020-catalog-actions-a3/list-dark-320px.png).
