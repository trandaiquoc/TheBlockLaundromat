# Workspace UI Audit — 2026-10-19

This is a dated verification record. The renovation is now accepted; its
fixture and capture limits below describe this audit's coverage only.

## Setup

Fresh Chrome captures were taken from an isolated local profile. Desktop views
used a 1600 × 857 CSS viewport. Narrow views used 320 × 740 CSS pixels with a
temporary empty 16 × 16 × 16 project. The populated desktop project contains
one Chain placed only in that profile.

## Current-run review

- The empty 3D Workspace was reviewed in Minecraft, Raccoon, Light, and Dark.
  The redundant empty-structure onboarding card is absent from the canvas.
- A placed Chain was checked in Dark 3D and Y-Layer modes, Selection Inspector,
  and Block Usage. Placement feedback and project counts remain available.
- The 320 px Vietnamese layout has no horizontal overflow. Both side drawers
  open within the viewport, focus their selected tab after the slide transition,
  keep Tab inside the drawer, and close with Escape while returning focus to the
  opener.
- Settings was opened in English and Vietnamese at 320 px. The menu and dialog
  remain within the viewport. Tab stays inside the dialog and Escape closes it
  and returns focus to the Settings trigger.
- With `prefers-reduced-motion: reduce` emulated, the drawer transition
  duration computed to 1 ms; focus still enters the selected tab and Escape
  returns focus to the opener.
- Theme and locale changes used the Workspace controls. Dark and Vietnamese
  remained selected after reload in the isolated profile.

## Captures

- [Empty 3D, Minecraft](01-workspace-empty-minecraft-desktop.png)
- [Empty 3D, Raccoon](02-workspace-empty-raccoon-desktop.png)
- [Empty 3D, Light](03-workspace-empty-light-desktop.png)
- [Empty 3D, Dark](04-workspace-empty-dark-desktop.png)
- [One placed Chain, Dark, 3D](05-workspace-populated-dark.png)
- [Block Usage, Dark](06-workspace-block-usage-dark.png)
- [Selection Inspector, Dark](07-workspace-selection-inspector-dark.png)
- [One placed Chain, Dark, Y-Layer](08-workspace-y-layer-dark.png)
- [Settings menu, English, 320 px](09-settings-menu-320-en.png)
- [Empty Y-Layer, Vietnamese, 320 px](10-workspace-empty-narrow-320-vi.png)
- [Blocks drawer, Vietnamese, 320 px](11-left-drawer-320-vi.png)
- [Settings menu, Vietnamese, 320 px](12-settings-menu-320-vi.png)
- [Settings dialog, Vietnamese, 320 px](13-settings-dialog-320-vi.png)
- [Selection drawer, Vietnamese, 320 px](14-right-drawer-320-vi.png)

## Acceptance limits

These captures cover the current shell and representative editor controls; they
do not establish visual acceptance for every modal or async workflow. Mod JAR
import preflight, progress, success, and error states were **NOT VERIFIED**
because no compatible Fabric 1.21.1 fixture is available. Earlier dated captures
remain historical context and are not counted as current-run PASS evidence.
