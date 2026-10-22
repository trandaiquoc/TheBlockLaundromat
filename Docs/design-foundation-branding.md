# The Block Laundromat Design Foundation

This is the current product-facing brand and visual-direction reference. The
four supplied designs inform future visual direction and shared application
UI; Angular components and current application behavior remain authoritative.
The Project Screen uses its traditional project-management layout.

## Brand

**The Block Laundromat** is a web application for building, editing, and
managing Minecraft Java structures. The supplied original logo is stored at
`Frontend/public/assets/brand/the-block-laundromat-logo.svg` and is used
unchanged. Its SVG contains one embedded PNG image (1774 x 887); it is not
vector artwork and has not been redrawn or optimized.

## Visual Direction

The references share one composition and differ by palette, lighting, and
scene:

| Direction | Palette and atmosphere                                                                 | Status                                    |
| --------- | -------------------------------------------------------------------------------------- | ----------------------------------------- |
| Minecraft | Grass-green pixel-patched chrome over jagged dirt-brown edges and neutral stone panels | Runtime theme (`craft` compatibility key) |
| Light     | Neutral white, black, and gray without a blue cast                                     | Runtime theme                             |
| Raccoon   | Charcoal/gray contrast with soft, rounded surfaces                                     | Independent runtime theme                 |
| Dark      | Near-black background with restrained charcoal elevation                               | Runtime theme                             |

The same layout, Angular components, spacing, content, and behavior serve all
four directions. Theme tokens change visual treatment, not feature behavior.
The Reality renderer background remains an independent user preference.

## Typography and Workspace

Comfortaa, Chakra Petch, and Pangolin are self-hosted through Fontsource and
can each be selected independently of all four themes. Small, Normal, and Large
font sizes scale the shared UI typography. UI code, registry IDs, and coordinate
readouts use the selected family too; operating-system font stacks are not part
of the selectable UI font contract. Canvas-rendered Minecraft sign text uses
the bundled Comfortaa face independently of the UI preference. New preferences and Appearance reset
to Minecraft (`craft`), Comfortaa, and a Dark workspace background. Existing
saved preferences are retained; legacy Geist and Minecraft-style font values
migrate to Comfortaa and Chakra Petch when preferences are normalized. Reality's
separate preset defaults are plains grass and Overworld day.

The editor workspace background remains independent of application chrome and
supports Dark, Light, and Reality. Reality combines a separately selected ground
texture with an Overworld day/night, Nether, or End sky; its ground is
presentation-only and never enters project data. Dark/Light continue to use
their existing renderer palettes. Workspace background changes apply directly,
without a scene-transition animation.

Settings Appearance has two independent sections: Interface and Workspace
Background. Each section's Restore defaults action changes only its own draft
fields. Interface defaults are Minecraft (`craft`), Comfortaa, and Normal font
size. Workspace Background defaults are Dark, Plains grass, and Overworld day.
These resets follow the Settings draft lifecycle; they are persisted only by
Apply or Save & Close.

Structure JSON Import keeps its dialog header, main tabs, and action footer
outside the content scroll region. The JSON source editor scrolls independently.
On wide layouts, the active import panel owns validation-preview scrolling; on
narrow layouts, the import content becomes the single outer scroll region. In
Create with AI, the active content tab owns scrolling on regular viewports, while
short or narrow viewports scroll the workspace host so all five tabs remain
reachable without nested clipped panels.

Application UI colors follow the canonical four-theme [Workspace Color Palette
V2](design/workspace-color-palette.md) through shared semantic tokens. The
Project Screen, both Settings entry points, and Editor surfaces use the same
theme mapping; Workspace-specific header, toolbar, and sidebar roles remain
scoped to the Editor. The renderer's Dark/Light/Reality environment remains
independent of the UI theme. Reality sky preset colors are shared through the
editor background contract so the renderer and Settings previews agree; ground
previews use the corresponding texture resource.

## Project Screen

The Project Screen presents a branded header with English/Vietnamese, theme,
and Settings controls, a project introduction, inline project creation, and a
recent-project list with Open and Delete actions. Structure JSON import uses
the validated import workflow. Its account card is a local presentation demo
that starts as `rakoon` on the Free Plan. Log out changes its display to Guest
without affecting projects, IndexedDB, preferences, or editor state; no
authentication or cloud-sync behavior is implied. Current implementation and
historical records are documented in
[Homepage and Project Screen](design/homepage-renovation/README.md).

The reference artwork depicts a project board, washer, logo, raccoons, and
other illustrated objects. These concepts are retained as design references;
the application does not load the reference artwork as a scene.

## References

The source images are preserved byte-for-byte in [design references](design/references/)
and are not loaded directly by the application:

1. [Minecraft](design/references/01-minecraft.png)
2. [Light](design/references/02-light.png)
3. [Raccoon](design/references/03-raccoon.png)
4. [Dark](design/references/04-dark.png)

They remain visual references for future design work and shared control
presentation. Current Project Screen behavior is documented in the
[Homepage and Project Screen notes](design/homepage-renovation/README.md).
Layered source cutouts and masks for a future 3D study are also retained under
`Frontend/source-assets/homepage/`; the traditional Project Screen does
not load them. The original images above remain the canonical references.

## Compatibility and Scope

The product-facing brand is **The Block Laundromat**. Build identifiers are
`TheBlockLaundromat` (Angular project) and `the-block-laundromat` (npm
package). The repository is `trandaiquoc/TheBlockLaundromat`, and the local
checkout directory is `TheBlockLaundromat`.

New Project Backup and Structure JSON exports use The Block Laundromat format
identifiers; importers continue to accept the former `minecraftbuilder-*`
formats. New default preferences and NBT export configuration use
`theblocklaundromat`. Existing saved custom namespace values are preserved.
Browser-local preferences, active-project references, and Quick Bar data are
copied to canonical keys on first read while their old keys remain untouched.
Project and asset IndexedDB database names, the asset-bundle v1 envelope, public
schema URL, Minecraft resource namespaces, semantic manifests, and diagnostic
schemas remain compatibility contracts. New asset bundles use the canonical
brand marker while the legacy marker remains accepted. Historical decision
records retain MinecraftBuilder as provenance. The existing database names
remain active rather than copying potentially large projects/assets into a
second database while retaining the originals. The checked-in public schema
keeps its established `$id`; no new public domain has been assigned.

This foundation documents the current branding and compatibility boundaries.
Homepage work does not add account or backend behavior.
