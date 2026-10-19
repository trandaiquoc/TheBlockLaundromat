# Workspace Cleanup Review - 2026-10-19

## Scope and setup

Fresh Chrome captures were taken from a temporary isolated profile using a
local 16 x 16 x 16 project named `Workspace audit blank`. The project was
created and populated only in that temporary profile. The review covered the
empty 3D viewport in Minecraft, Raccoon, Light, and Dark; one placed Chain in
3D and Y-Layer; and the 320 x 800 Vietnamese Y-Layer layout.

## Findings and verification

- The empty viewport no longer shows the redundant starter card in either mode.
  The empty canvas, sidebars, toolbar, and quick bar remain available.
- Placing one Chain still updates the project count and shows the Quick Bar;
  viewport feedback remains in the shared layer without onboarding content.
- Theme and locale changes were made through the Workspace Settings menu.
  Minecraft, Raccoon, Light, Dark, English, and Vietnamese all applied. After a
  reload, Dark and English were restored from saved preferences.
- At 320 x 800 in Vietnamese, document and body widths stayed at 320 px. The
  Settings menu stayed within the viewport. Escape closed the menu and the
  Settings dialog.
- The Settings dialog backdrop computed to `rgba(0, 0, 0, 0.48)`, matching
  `--overlay-scrim`. Under `prefers-reduced-motion: reduce`, its animation and
  transition durations computed to 1 ms.
- The Quick Bar remove button and Groups search-clear button each measured
  24 x 24 CSS px in Chrome.

## Captures

- [Empty 3D viewport, Minecraft, 1600 x 1280](workspace-empty-minecraft-1600x1280.png)
- [Empty 3D viewport, Raccoon, 1600 x 1280](workspace-empty-raccoon-1600x1280.png)
- [Empty 3D viewport, Light, 1600 x 1280](workspace-empty-light-1600x1280.png)
- [Empty 3D viewport, Dark, 1600 x 1280](workspace-empty-dark-1600x1280.png)
- [One placed Chain, Dark, 3D, 1600 x 1280](workspace-populated-dark-1600x1280.png)
- [One placed Chain, Dark, Y-Layer, 1600 x 1280](workspace-y-layer-dark-1600x1280.png)
- [One placed Chain, Dark, Y-Layer, Vietnamese, 320 x 800](workspace-y-layer-vietnamese-320x800.png)

## Remaining limitation

The Mod JAR import preflight, progress, completion, and failure screens remain
**NOT VERIFIED** because no compatible Fabric 1.21.1 mod JAR fixture is
available. See the [Workspace acceptance inventory](../../WORKSPACE-UI-ACCEPTANCE-INVENTORY.md).
