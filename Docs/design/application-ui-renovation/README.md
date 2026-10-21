# Application UI renovation

The application UI renovation is complete and accepted. This folder keeps the
current maintenance contract; dated implementation checkpoints, test logs,
surface inventories, and screenshots are not current product documentation.

Read [Current UI contract](CURRENT-UI-CONTRACT.md) for ownership, navigation,
workflow boundaries, accessibility, responsive behavior, and verified limits.
Detailed contracts remain with their owning documentation:

- [Four-theme palette](../workspace-color-palette.md)
- [Workspace layout and inspector](../workspace-renovation/README.md)
- [Homepage and Project Screen](../homepage-renovation/README.md)
- [Structure JSON](../../structure-json.md)
- [Minecraft assets and Asset Manager](../../minecraft-assets.md)
- [Structure NBT export](../../minecraft-structure-nbt-1.21.1.md)

Implementation follows the existing Angular application and editor/renderer
ownership boundaries. The renovation changes presentation and command
discoverability; it does not change project data, file formats, persistence,
history, rendering semantics, or import/export validation.
