# Application UI renovation

Implementation in progress from local HEAD `8eeeb9b5`. This work covers navigation,
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

| Checkpoint | Boundary                                                                                     | Status                                      |
| ---------- | -------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A          | Quick Bar names, compact catalog actions, selected states and Raccoon treatment              | Implemented; targeted/browser checks passed |
| B          | Reality configuration discoverability and applied/saved/draft clarity in the shared Settings | Implemented; targeted/browser checks passed |
| C          | Header command/navigation ownership, discoverability and duplicate options                   | Implemented; targeted/browser checks passed |
| D          | Modal, nested overlay, picker and feedback presentation/accessibility                        | Implemented; targeted/browser checks passed |
| E          | Settings hierarchy and real bilingual Help/documentation                                     | Implemented; targeted/browser checks passed |
| F          | Every supported import/export workflow and its nested decisions                              | In progress: project backup wired           |
| G          | Vanilla/Mod assets, preflight, details, diagnostics and recovery                             | Pending                                     |
| H          | Project/diagnostics and all specialized editor surfaces                                      | Pending                                     |
| I          | Only confirmed business-logic defects, isolated from presentation commits                    | I1: JSON saved-download recovery fixed      |

Each implemented checkpoint gets targeted tests, relevant localhost interaction
checks and its own local commit. The final gate includes the full suite, app
typecheck, production build, tool checks, scoped formatter, encoding and diff
checks. No remote push is authorized by this work.

Checkpoint evidence: [D — shared dialogs and overlays](CHECKPOINT-D.md).
Checkpoint E evidence: [E — Settings and Help](CHECKPOINT-E.md).
Checkpoint F backup evidence: [F1 — project backup](CHECKPOINT-F1.md).
Checkpoint F JSON export evidence: [F2 — export intent](CHECKPOINT-F2.md).
Checkpoint F JSON input evidence: [F3 — file and review feedback](CHECKPOINT-F3.md).

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
