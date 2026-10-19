# Checkpoint C — header commands and navigation

Local implementation evidence, 2026-10-20. This is a checkpoint record, not the
final application renovation acceptance report.

## Changes

- Replaced File → New project and File → Open project with one localized
  Projects… command. Both old entries already emitted the identical
  `navigate-projects` action; the existing project screen owns both create and
  open flows, so no command behavior or project data path changed.
- Removed the unused `unavailable-feature` action, shell branch/dialog method
  and English/Vietnamese message after confirming there were no producers or
  other consumers in `Frontend/src/app`.
- Kept direct toolbar commands, menu keyboard navigation and the compact mobile
  menu on the existing shared menu definitions.

## Verification

- Targeted Editor Chrome and Editor Shell specs: **50 tests passed** across two
  files, including one Projects… menu entry and its existing navigation action.
- Localhost browser: all seven menus opened; current item counts are File 6,
  Edit 5, View 10, Tools 3, Settings 10, Help 2 and Camera 7 (43 total). The
  desktop and 390 px compact Projects… commands both reached `/`; the compact
  File menu fit inside the viewport and Escape closed the application menu.
- Browser interaction used the existing review project; no project data was
  changed.
