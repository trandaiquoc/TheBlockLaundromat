# Workspace renovation

The Workspace UI renovation is complete and accepted. This page maps the
current layout and behavior contracts; it does not track implementation
checkpoints.

## Current contracts

- [Responsive layout and contextual Inspector](RESPONSIVE-LAYOUT-AND-CONTEXTUAL-INSPECTOR.md)
  defines the Workspace shell, narrow Menu and drawers, Layer options,
  Placement/Selection contexts, and metadata-driven property controls.
- [Block Browser Grid/List](BLOCK-BROWSER-GRID-LIST.md) defines the responsive
  virtualized views, shared catalog, source selection, full-ID details, and
  selection/action states.
- [Groups Panel](GROUPS-PANEL.md) defines group selection, visibility/lock,
  naming, move, and row actions.
- [Interaction design principles](INTERACTION-DESIGN-PRINCIPLES.md) defines
  shared interaction and accessibility expectations.
- [Workspace color palette](../workspace-color-palette.md) owns the four-theme
  values and semantic tokens.
- [Application UI contract](../application-ui-renovation/CURRENT-UI-CONTRACT.md)
  summarizes shared navigation, Settings, Help, dialogs, and import/export
  ownership.

Editor commands, project data, history, persistence, specialized inspectors,
and renderer ownership remain with their existing feature and core services.
Workspace presentation must preserve those boundaries and the renderer's
large-project lifecycle.

## Verification records

The [coverage inventory](WORKSPACE-UI-ACCEPTANCE-INVENTORY.md) records the
current contract and distinguishes accepted implementation from browser states
that were not independently exercised. In particular, a compatible Fabric JAR
fixture is not available for a local import-state browser run; this is a
verification limit, not unfinished UI work. The [evidence index](evidence/README.md)
links dated records and approved references. Dated captures document only the
states they show and are not current implementation instructions.

The four approved Workspace compositions are
[Minecraft](references/approved-workspace-minecraft.png),
[Raccoon](references/approved-workspace-raccoon.png),
[Light](references/approved-workspace-light.png), and
[Dark](references/approved-workspace-dark.png). They are design references,
separate from browser captures and application content.

The [Homepage and Project Screen contract](../homepage-renovation/README.md)
covers the restored traditional project-management screen. The earlier
laundromat-scene composition is historical and is not current implementation
work.
