# Current application UI contract

The application UI renovation is complete and accepted. This document records
the current ownership and user-visible contracts needed for maintenance. Source
code and the format-specific documents linked below remain authoritative.

## Ownership

- The Project Screen owns project selection and its local create, import, open,
  and delete entry points. Project workflows own validation and persistence.
- `EditorShellComponent` composes the workspace and routes commands to their
  domain workflows. `EditorChromeComponent` owns the responsive application
  menus and emits typed actions; it does not own project or renderer data.
- Feature components own their presentation and local interaction state.
  Focused workflow/session owners handle multi-step operations such as Settings,
  Structure JSON import, and Mod import.
- The editor engine owns editing state and command/history semantics. The
  renderer owns the 3D scene, camera, geometry, and render-resource lifecycle;
  project data remains authoritative.
- Shared dialogs, controls, localization, preferences, and theme tokens remain
  in the existing shared/core UI boundaries. Theme values belong to
  [`workspace-color-palette.md`](../workspace-color-palette.md).

## Navigation and help

The editor header exposes File, Edit, View, Tools, Settings, Help, and Camera
menus. Narrow layouts place the command groups in the compact application Menu;
mode, Place/Select, Undo/Redo, and Camera remain directly reachable. Help is a
bilingual, searchable reference for current workspace commands, settings,
assets, import/export, and keyboard/mouse controls. Shortcut content is read
from the active binding services rather than maintained as a second list.

The left workspace panel owns Blocks, Decorations, and Groups. The right panel
owns context-sensitive selection and specialized inspectors. The Quick Bar
keeps slot names available to assistive technology and does not show a visible
hover-name popup. Block Browser grid/list views share one catalog and source
selection; selected and action states remain distinct and keyboard operable.
The shared camera-axis gizmo sits in the lower-right of the 3D and Y-Layer
viewports, clear of the Y-Layer controls and the Quick Bar overlay, and
continues to follow camera orientation.
See the [Workspace renovation contract](../workspace-renovation/README.md) for
responsive layout and panel ownership.

## Dialogs and workflows

Shared dialogs own focus entry, containment, Escape handling, and focus return.
The workflow that owns a decision owns its validation and commit boundary; a
dialog presents the result and user choices. Cancel, Escape, failed reads, and
recoverable operation errors leave uncommitted project data unchanged.

- Settings keeps draft and saved preferences distinct. Apply/Save, Cancel,
  Reset, and discard confirmation stay with the Settings session. Homepage and
  Workspace use the same locale, theme, and preference services. Reality is a
  workspace background preference, independent from the application theme;
  opening Settings or viewing presets does not apply a draft. Reset selects
  Dark as the workspace background.
- Structure JSON import validates and previews before Apply. Replace replaces
  blocks and decorations; Merge and New Group append according to conflict and
  bounds checks. One accepted import makes one history commit. File-read or
  validation errors do not mutate the project. Create with AI creates local,
  copy-ready text and does not call an AI service.
- Project Backup remains the lossless project backup format. Structure JSON is
  a separate human-readable interchange format. Structure NBT and datapack
  export retain their verified 1.21.1 and size-policy boundaries. See the
  [Structure JSON](../../structure-json.md) and
  [Structure NBT](../../minecraft-structure-nbt-1.21.1.md) contracts.
- Asset Manager presents versioned vanilla assets and resource-only Fabric mod
  import, replacement, removal, and activation choices. Existing asset services
  own loading, cache, and provider lifecycles. The UI never executes JAR code.
  Diagnostics groups content, visual, behavior, and asset issues; it reports
  unknown or missing content without rewriting it as Air. See
  [Minecraft asset policy](../../minecraft-assets.md).

Async operations use their existing cancellation and stale-result guards.
Failed or cancelled operations preserve saved project data and release owned
resources. Persistence, autosave/recovery, Undo/Redo, atomic history, renderer
resources, and performance behavior are outside the UI presentation layer and
must remain unchanged by UI-only work.

## Accessibility and responsive behavior

Controls use semantic roles, accessible names, keyboard operation, visible
focus, and explicit selected/disabled feedback. Dialogs and narrow drawers
manage focus and Escape consistently. Layouts support narrow viewports, English
and Vietnamese, and all four application themes: Minecraft (`craft`), Light,
Raccoon, and Dark. Comfortaa, Chakra Petch, and Pangolin remain independent font
choices. The workspace background supports Dark, Light, and Reality independently
of the application theme. Theme values and component states use shared semantic
tokens; see the [palette contract](../workspace-color-palette.md).

The Project Screen keeps its existing workflows above the Homespace visual
layer. Minecraft (`craft`) and Dark use one scene geometry and the same current
artwork; Dark adds cool-night lighting. Light and Raccoon keep their existing
page backgrounds. The scene uses one 1672 × 941 artboard, transparent
door/window openings, a separate outside panorama, and independent object,
lighting, and projected-UI layers. It scales uniformly to viewport height and
allows horizontal panning when the scene is wider than the viewport. Vertical
scene panning is disabled. Dragging and arrow keys pan only the overflowing
scene horizontally without moving Project Screen controls. Narrow layouts keep
the existing page scrolling and compact spacing so create actions remain
reachable without browser fullscreen. Current generated plates are stored under
`Frontend/public/assets/homespace/temporary/`; they are placeholders under
visual review and do not yet meet the source-reference fidelity requirement.

## Verified limits

- Fabric mod support imports static resources only; it does not run mod code or
  provide Forge/runtime behavior. Unsupported and unresolved content remains
  identified and diagnosable.
- Structure JSON omits unsupported raw block-entity NBT; use Project Backup
  when full project fidelity is required. Structure NBT export is version-gated
  and emits diagnostics for data it cannot represent losslessly.
- Account presentation is local demo UI. It does not provide authentication,
  cloud sync, or account-backed project storage.

These are product/data limits, not unfinished UI renovation work. More detailed
Minecraft and format limits are maintained in the linked asset and export
contracts.
