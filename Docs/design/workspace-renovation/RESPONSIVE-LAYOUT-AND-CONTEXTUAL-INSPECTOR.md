# Responsive Workspace and Contextual Inspector

Current P0/P1 contract. These changes concern Workspace presentation and UI
interaction; they do not add project fields or Minecraft behavior.

## Responsive shell

At widths up to 850 CSS px, one Menu opens the existing six application command
groups. The same command DOM and action dispatch serve desktop and narrow
layouts. Place/Select and Undo/Redo remain directly available; camera presets
remain in Camera, and Fit/Focus remain accessible through View. The mode pair
stays explicitly labeled on its own compact row rather than becoming an
unlabeled icon or a second command implementation.

Blocks and Inspector open from a bottom dock above the Status Bar. Blocks keeps
its modal drawer and its Blocks, Decorations, and Groups tabs. Desktop retains
docked sidebars, saved widths, and pointer/keyboard resizing.

The Inspector has one authoritative sheet state: closed, collapsed, or expanded.
Expanded is a modal bottom sheet, bounded by the editor body and a maximum of
72dvh; focus enters its selected tab, Tab stays inside, and Escape closes it and
returns focus to the opener. Collapse leaves a 4.5rem nonmodal header; its body
is hidden from interaction, the backdrop and focus trap are released, and the
Quick Bar moves above that header. Expand and Close remain labeled, keyboard
accessible touch controls. The Status Bar and bottom dock retain their space.
Returning to desktop releases the sheet state and trap. Reduced motion skips
the transition and moves focus on the next frame.

## Y-Layer controls

The primary row contains previous layer, numeric Y, next layer, and Layer
options. Layer options contains the Y slider, all four occupied-layer navigation
actions, visibility, and reference opacity. There is one implementation of each
control. The panel scrolls within the available viewport height. Escape closes
it and returns focus to its summary; outside click/focus and viewport
deactivation close it. A nested themed select consumes its own Escape first.

`LayerControlsComponent` owns control presentation and popover interaction. It
emits typed actions to the existing Y-Layer methods; projection, cancellation,
camera input, placement, and retained renderer ownership remain with their
existing owners.

## Inspector contexts and editing

Properties distinguishes Placement and Selection. Its default follows the tool;
the user can explicitly inspect the other context until the tool changes.
Changing this context never clears or replaces the real selection.

One Quick actions row sits directly below the context controls, before either
context's details. Select all is enabled when the project has blocks; Clear
selection is enabled for a real block or decoration selection. These buttons
dispatch the existing shell commands and are not duplicated in SelectionInspector.

Placement presents the active block's real inventory thumbnail, name, registry
ID, and read-only state details, or the active decoration identity. Its empty
state points to the browser and Quick Bar. It does not edit placed blocks.

The Status Bar omits its active-material label while this Placement context is
visible in the Properties tab. It restores the label for Selection, Block Usage,
a hidden sidebar, or a closed/collapsed narrow sheet. The shell derives visibility
from its layout and the Inspector's context; material state remains with the
existing block/decorations services. Save status, coordinates, current Y, block
count, and assets retain their existing presentation.

At widths up to 640 CSS px, the Status Bar gives activity a full-width row
between mode/tool context and project metrics. This keeps Saved, the active
material, and Current Y readable when the narrow Inspector is closed or
collapsed; block count, dimensions, and asset status stay on the final row.
At 360 px and below, metrics and asset status each get a full-width row, and the
active material keeps its name without the repeated label so Vietnamese labels
do not crowd Current Y.

New projects, new Structure JSON projects, missing stored preferences, and
renderer fallbacks use 15% reference-layer opacity. Explicit stored values,
including zero, take precedence; the slider and persistence remain available.
Visibility modes share this default without changing renderer backgrounds or
block colors.

Selection keeps the existing single, logical set, box, decoration, sign,
inventory, item-display, decorated-pot, membership, and selection-action paths.
Position and Group remain read-only. Identity appears once; the editable
properties are primary, while exact raw state and effect metadata live in
Technical details. Structure overview is collapsed when a selection exists.

Property controls use descriptor values, not registry IDs:

- Exactly `true` and `false`: a labeled switch.
- Two to four short values with short localized labels: keyboard navigable
  radio segments.
- Other value sets: the existing themed select.
- Derived properties: visible Auto marker and disabled controls.
- Locked groups: all property and rotation controls remain disabled.

All value changes still pass through the existing `StructureEditorService`
validation and history transaction. Preserved unknown state values remain in
the descriptor and raw state view. No Position editor or Duplicate command was
introduced from the exploratory mockups.

## Ownership and acceptance matrix

| Boundary            | Authoritative owner and source audit                                                                                           | Protection                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Commands            | Existing `EditorChromeAction` dispatch; compact Menu reuses the application menus                                              | Chrome keyboard/action specs; native Chrome narrow menu checks                                  |
| Sheet               | Shell owns one state union; open/expanded flags are derived; legacy horizontal right drawer rules removed                      | Shell focus/trap/collapse/resize specs; native Chrome Escape, reduced motion and resize checks  |
| Layer UI            | LayerControls owns the panel; Y-Layer owns state and existing action methods; old inline toolbar/schema removed                | LayerControls action/closure specs; Chrome numeric/slider/occupied/opacity/visibility workflows |
| Context             | ContextualInspector owns only a tool-linked presentation choice; selection stays in its existing service                       | Context test with a retained real selection; Chrome Place/Select switching                      |
| Property controls   | PropertyControl owns metadata-based presentation; SelectionInspector owns the existing edit callback                           | Boolean/enum/readonly/keyboard specs; locked, derived and Undo/Redo browser cases               |
| Runtime lookup      | Index and compact-all bounds preparation run in an effect; selection computations read existing state without signal writes    | Deferred context mounting and explicit/compact selected-set tests                               |
| Specialized editors | Existing components, capabilities and lock inputs retained                                                                     | Existing inspector and editor regression specs                                                  |
| Assets and scale    | Identity requests one catalog item through the existing thumbnail scheduler; no per-block DOM, frame work or new project scans | Source audit; existing renderer/runtime regression suite, without a benchmark claim             |

No dependency was added. Components continue to use canonical semantic tokens,
the existing EN/VI catalog, and the three supported UI fonts. Motion affects
chrome surfaces only and honors `prefers-reduced-motion`.

The [focused browser evidence](evidence/20261019-responsive-context-inspector/README.md)
records the four-theme/locale/viewport matrix and retained before/after captures.
This is UI verification, not a Minecraft or benchmark claim.

## Placement consistency

The editor's virtual floor below Y=0 supports standing Lanterns through the same
support-below rule as standing signs, torches, and floor-supported blocks. It
does not create project blocks or support floating placements above Y=0.
Chain-hanging Lanterns still require the existing verified attachment support.

Precise picking of double-sided model faces reports the side approached by the
pointer ray. When equally near model faces meet at one point, an actual voxel
boundary face takes precedence over an internal model face when exactly one
voxel axis is on its boundary. This resolves the Iron Bars upper cap where the
official 1.21.1 `iron_bars_post_ends` geometry reports coincident internal side
faces first, without changing geometry or widening hitboxes. Both the 3D DDA
precise fallback and direct Y-Layer picking use this resolver. Preview and
commit retain the shared placement plan and atomic history. A picked normal is
resolved along its dominant voxel axis, so floating-point residue cannot turn a
side face into a diagonal target. Placement previews expose the neighbor-derived
state from their local preview overlay, matching the committed Iron Bars
connection state without scanning the full project. Candidate resolution stops
after the nearest intersection and its coincident faces, avoiding a scan of
farther model surfaces on pointer-picking events.
