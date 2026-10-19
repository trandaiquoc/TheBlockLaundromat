# 2026-10-19 Workspace scanning follow-up

## Scope

This follow-up refines the Block Browser scan hierarchy and the empty
Selection Inspector state. It keeps the existing three-region editor, theme
system, catalog filtering and virtualization, asset thumbnail lifecycle,
selection behavior, and Quick Bar contract.

The Block Browser now uses quiet separators between 56 px rows instead of a
framed surface on every item. Registry IDs gain line-break opportunities
after `:` and `_` while preserving their original text and accessible name.
Quick Add remains visible with a 44 x 44 px target and clear keyboard focus.
The empty Inspector no longer presents unavailable Quick Actions; individual
actions appear only when they can run.

## Browser checks

An isolated headless Chrome profile created a local review project and checked:

- Minecraft, Raccoon, Light, and Dark themes at 1600 x 900, with no horizontal
  overflow and visible catalog results in each theme.
- Comfortaa, Chakra Petch, and Pangolin settings, then restored Comfortaa.
- Vietnamese at 320 x 740: the full registry ID
  `minecraft:polished_blackstone_brick_stairs` remained available in text and
  the title; Quick Add measured 44 x 44 px; document width stayed at 320 px.
- Enter selected a catalog block and Enter on Quick Add added its block to the
  Quick Bar. The action then became disabled for the already-added block.
- The empty project hid its unavailable Quick Actions.
- No uncaught browser errors were recorded.

| Capture                                                             | State                                      |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [Minecraft](01-minecraft-empty-workspace.png)                       | Empty Workspace at 1600 x 900              |
| [Raccoon](02-raccoon-empty-workspace.png)                           | Empty Workspace at 1600 x 900              |
| [Light](03-light-empty-workspace.png)                               | Empty Workspace at 1600 x 900              |
| [Dark](04-dark-empty-workspace.png)                                 | Empty Workspace at 1600 x 900              |
| [Vietnamese narrow Block Browser](05-vietnamese-narrow-long-id.png) | 320 x 740 drawer with the long registry ID |
| [Vietnamese narrow Quick Bar](06-vietnamese-narrow-quick-add.png)   | Block added through keyboard activation    |

These captures check the changed surfaces and selected responsive states. They
do not close the broader Workspace acceptance gaps listed in the
[acceptance inventory](../../WORKSPACE-UI-ACCEPTANCE-INVENTORY.md), including
unreviewed dialog and async Mod JAR states that require a compatible fixture.

## Design references

- [Figma navigation and sidebar](https://help.figma.com/hc/en-us/articles/360039831974-Explore-the-navigation-bar-and-left-sidebar)
- [Blender editor guidelines](https://developer.blender.org/docs/features/interface/human_interface_guidelines/editors/)
- [Linear interface refresh](https://linear.app/now/behind-the-latest-design-refresh)
- [Lucian UX/UI Prompt](https://lucianlabs.dev/uxui-prompt/)
