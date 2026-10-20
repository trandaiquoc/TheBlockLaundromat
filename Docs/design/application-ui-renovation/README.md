# Application UI renovation

Implementation in progress from the current local HEAD. This work covers navigation,
menus, shared UI, Settings, Help, all existing dialogs and their nested workflows.
It does not reopen unrelated Homepage composition or change Minecraft/file-format
semantics to accommodate presentation.

## Coverage and completion

The [surface inventory](UI-SURFACE-INVENTORY.md) records the baseline owners,
entry points, nested flows, design decisions and verification status. Its source
coverage is reconciled with all Angular component declarations, routes, component
consumers, inline overlays, native file inputs and shared-dialog call sites.
Browser observations use a disposable local project/profile, real Vanilla assets
and the local Cobblemon Fabric resource archive; uploaded classes are not executed.
Temporary probes and captures stay in ignored `.artifacts/` until selected evidence
is retained. Historical screenshots are not current-run verification.

Completion requires every inventory row to have an explicit decision and evidence,
every chosen implementation to be finished, existing commands to remain reachable,
checkpoint regressions to be resolved and the final automated/browser gates to pass.
An inventory entry or green build alone is not visual acceptance.

## Checkpoints

| Checkpoint | Boundary                                                                                     | Status                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A          | Quick Bar names, compact catalog actions, selected states and Raccoon treatment              | Implemented; catalog/Quick Bar browser checks passed                                                |
| B          | Reality configuration discoverability and applied/saved/draft clarity in the shared Settings | Implemented; targeted/browser checks passed                                                         |
| C          | Header command/navigation ownership, discoverability and duplicate options                   | Implemented; targeted/browser checks passed                                                         |
| D          | Modal, nested overlay, picker and feedback presentation/accessibility                        | Implemented; targeted/browser checks passed                                                         |
| E          | Settings hierarchy and real bilingual Help/documentation                                     | Implemented; targeted/browser checks passed                                                         |
| F          | Every supported import/export workflow and its nested decisions                              | In progress: project backup wired                                                                   |
| G          | Vanilla/Mod assets, preflight, details, diagnostics and recovery                             | In progress: G1–G7; real unsupported-Mod compatibility and activation cancellation remain           |
| H          | Project/diagnostics and all specialized editor surfaces                                      | In progress: H1–H7 viewport, Homepage account controls and diagnostics; specialized surfaces remain |
| I          | Only confirmed business-logic defects, isolated from presentation commits                    | I1–I4 confirmed correctness fixes recorded separately                                               |

Each implemented checkpoint gets targeted tests, relevant localhost interaction
checks and its own local commit. The final gate includes the full suite, app
typecheck, production build, tool checks, scoped formatter, encoding and diff
checks. No remote push is authorized by this work.

Checkpoint evidence: [D — shared dialogs and overlays](CHECKPOINT-D.md).
Checkpoint E evidence: [E — Settings and Help](CHECKPOINT-E.md).
Checkpoint F backup evidence: [F1 — project backup](CHECKPOINT-F1.md).
Checkpoint F JSON export evidence: [F2 — export intent](CHECKPOINT-F2.md).
Checkpoint F JSON input evidence: [F3 — file and review feedback](CHECKPOINT-F3.md).
Checkpoint F NBT/AI audit: [F4 — retained workflows](CHECKPOINT-F4.md).
Checkpoint F file-policy parity: [F5 — Structure JSON entry points](CHECKPOINT-F5.md).
Checkpoint F review hierarchy: [F6 — import choices](CHECKPOINT-F6.md).
Checkpoint G initial asset manager refinement: [G1 — Vanilla tab intent](CHECKPOINT-G1.md).
Checkpoint G nested confirmation safety: [G2 — asset manager confirmation](CHECKPOINT-G2.md).
Checkpoint G real Fabric archive workflow: [G3 — Cobblemon import and cleanup](CHECKPOINT-G3.md).
Checkpoint G archive errors: [G4 — Mod JAR error presentation](CHECKPOINT-G4.md).
Checkpoint G nested overlays: [G5 — Escape and loader limits](CHECKPOINT-G5.md).
Checkpoint G offline/cache recovery: [G6 — Vanilla fallback and recovery](CHECKPOINT-G6.md).
Checkpoint G timeout/retry and warning diagnostics: [G7 — Mod preflight recovery](CHECKPOINT-G7.md).
Checkpoint A2 catalog controls: [A2 — action placement and shared active states](CHECKPOINT-A2.md).
Checkpoint H1 viewport controls: [H1 — XYZ gizmo and Y-Layer stepper](CHECKPOINT-H1.md).
Checkpoint H2 viewport follow-up: [H2 — signed gizmo and compact Quick Bar](CHECKPOINT-H2.md).
Checkpoint H3 viewport visual refinement: [H3 — separated feedback and themed gizmo surfaces](CHECKPOINT-H3.md).
Checkpoint H4 feedback separation: [H4 — status and coordinates across themes](CHECKPOINT-H4.md).
Checkpoint H5 account controls: [H5 — Homepage account and responsive controls](CHECKPOINT-H5.md).
Checkpoint H6 diagnostics: [H6 — issue-first diagnostics and optional renderer details](CHECKPOINT-H6.md).
Checkpoint H7 asset-audit filters: [H7 — category filters and visual grouping](CHECKPOINT-H7.md).
Checkpoint I2 stale Mod JAR state: [I2 — replacement validation](CHECKPOINT-I2.md).
Checkpoint I3 archive validation: [I3 — malformed ZIP classification](CHECKPOINT-I3.md).
Checkpoint I4 activity lifecycle: [I4 — failed task state](CHECKPOINT-I4.md).

## Preserved contracts

- The actual defaults are Minecraft preset, Dark base and Dark Workspace
  Background. All remain unchanged, including existing saved preferences.
- Opening Settings or browsing Reality configuration must not apply Reality.
  Draft controls, effective values and saved values must be identified separately;
  Apply/Save/Cancel/Reset stay owned by the existing settings session.
- Project parsing, validation, serialization, schemas, IDs, state data, atomic
  history, autosave/recovery, async cancellation and renderer ownership stay intact.
- The current GroupService, Groups presentation contracts and catalog virtualization
  remain authoritative. UI refinements do not create project blocks or frame-loop work.

## User-added visual acceptance

User-added visual acceptance, 2026-10-20: refine the catalog card `i` and `+`
positions, center block names in cards, and keep selected-state treatment
consistent between Light and Dark while remaining clear. Preserve the shared
component structure, touch targets, keyboard behavior and semantic theme
tokens; verify across all four themes.

The same update adds a viewport refinement: replace the long X/Y/Z readout with
an aligned, separately colored coordinate group; redesign the Y-Layer strip as
one compact stepper with its Y label integrated beside the value; and add an
interactive XYZ orientation gizmo beside the grid. Do not render Y as a
standalone badge. In Minecraft, Y is vertical. Axis interactions must update
the existing camera, not add a second camera state or change project coordinates.

Asset-audit summary counts are interactive filters: activating a count filters
the records below, and activating it again restores all records. Visually group
visual coverage and behavior coverage with distinct semantic colors and matching
selected states in every theme.

User follow-up, 2026-10-20: keep the live voxel coordinate only in the viewport's
upper feedback and remove the duplicate selected/hover coordinate from the lower
status bar. Render coordinates as a compact X/Y/Z group using matching axis
colors, without a long full-width strip. Place a small, clear signed-axis gizmo
at the viewport's upper right in both 3D and Y-Layer. The gizmo follows camera
orbit orientation. Clicking an axis frames the whole structure around its center
even if a block is selected; selection must not change the camera pivot or
mutate project content. Minecraft Y is vertical. Explain these behaviors in
bilingual Camera navigation Help.

User follow-up, 2026-10-20: remove the visible hover-name popup from the Quick Bar
to keep the compact toolbar clear. Keep each slot's full accessible button name.

User follow-up, 2026-10-20: separate the placement-status label and live X/Y/Z
readout more clearly. Keep the status chip semantically tinted and the coordinate
chip neutral, with enough gap to read as separate controls. The XYZ gizmo keeps
one component, geometry and interaction model across Minecraft, Raccoon, Light
and Dark; semantic theme tokens supply its colors and material.

User follow-up, 2026-10-20: keep Homepage language/theme/Settings controls clear
at narrow widths. Preserve the desktop single-row layout; arrange the compact
mobile controls in two intentional rows rather than relying on incidental wraps.

## Research grounding

The implementation will adapt patterns to this product rather than copy another
editor's layout or add speculative actions:

- [Figma keyboard workflows](https://help.figma.com/hc/en-us/articles/360040328653-Use-Figma-products-with-a-keyboard):
  discoverable actions and keyboard entry points alongside direct controls.
- [Blender menu search](https://docs.blender.org/manual/en/4.0/interface/controls/templates/operator_search.html):
  searchable operations as an additional route to existing commands.
- [VS Code interface](https://code.visualstudio.com/docs/editing/getting-started/userinterface)
  and [settings](https://code.visualstudio.com/docs/configure/settings): stable
  navigation and searchable, grouped configuration.
- [Linear's interface refinement](https://linear.app/now/behind-the-latest-design-refresh)
  and [contextual menus](https://linear.app/now/invisible-details): calmer hierarchy,
  deliberate spacing and reliable pointer travel between related actions.
- [LucianLabs patterns](https://lucianlabs.dev/uxui-prompt/): focused examples of
  command discovery, upload progress, inline feedback and recoverable empty states.
  Animated examples are not a requirement to add motion to editor hot paths.
