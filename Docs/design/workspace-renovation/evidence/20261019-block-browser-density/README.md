# Block Browser Density Review — 2026-10-19

## Setup

Fresh Chrome captures used a temporary browser context and an empty 16 × 16 × 16
project named `Workspace design QA`. Desktop views used 1600 × 900 CSS pixels.
The narrow view used 320 × 740 CSS pixels with Vietnamese selected and the
Block Browser drawer open on `polished_blackstone_brick_stairs`.

## Review

- The same Block Browser layout was checked in Minecraft, Raccoon, Light, and
  Dark. The virtual row measures 68 px in each theme; the 44 px preview and
  32 × 32 px Quick Add target stay consistent.
- The reduced row height allows about 17.6% more catalog entries in the same
  scroll area than the former 80 px row.
- The long registry ID wraps to two lines in the narrow drawer, and the drawer
  remains within the 320 px viewport.
- A keyboard-focused block activates with Enter. Quick Add changes to its
  existing “Already in Quick Bar” state after activation.
- With reduced motion enabled, the shared control transition computes to 1 ms.
- No console errors were reported. The temporary project was isolated in the
  browser context and did not alter user project data.

## Captures

- [Minecraft, desktop](01-minecraft-desktop.png)
- [Raccoon, desktop](02-raccoon-desktop.png)
- [Light, desktop](03-light-desktop.png)
- [Dark, desktop](04-dark-desktop.png)
- [Vietnamese narrow drawer with long registry ID](05-narrow-vietnamese-long-id.png)
