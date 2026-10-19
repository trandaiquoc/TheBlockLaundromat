# Craft Create Tile Alignment Checkpoint

- Browser viewport: 1672 × 941, Craft theme, empty project board.
- The live Create Project tile uses the 142 × 156 source crop at `(1026, 385)` from `Docs/design/references/01-minecraft.png`. The crop is pixel-identical to the checked-in runtime PNG.
- The perspective-transformed project board shifted the interactive button relative to the artwork. A responsive `translate(-4.2%, 3.8%)` corrects the live hit-area/art alignment; at this viewport it resolves to approximately `(-5.95px, +5.91px)`.
- Browser interaction: clicking the tile opened the existing menu with “Start a new project” and “Create from Structure JSON”; Escape closed the menu.
- Screenshot: `craft-empty-tile-aligned-browser-1672x941.png`.

This is a focused alignment and interaction checkpoint only. The source-baked tile remains beneath the live scene, and the complete static Minecraft scene has not passed visual acceptance.
