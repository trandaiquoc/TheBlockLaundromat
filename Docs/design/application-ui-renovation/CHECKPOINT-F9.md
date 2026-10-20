# Checkpoint F9 - import/export branch audit

Local final branch audit, 2026-10-20. Existing parsers, planners, formats,
project persistence, and History ownership remain authoritative.

## Structure JSON import

- Browser applied Replace (3 blocks and one painting), Merge (three additional
  blocks and one painting), and New Group (three grouped blocks and one grouped
  painting). Undo and Redo restored blocks, logical decorations and group
  membership after each import.
- A Merge coordinate collision and Replace with a locked group stayed blocked
  without changing the project. Painting support was validated before the plan
  could apply it.
- The browser resized a Huge project from 49 to the 512-block boundary, then
  Undo/Redo restored each document. A request for 513 blocks showed the explicit
  over-limit warning; resize was rejected and Keep current size reported that
  clipping would leave no content. Neither choice changed the project.
- Focused import, exporter, codec, AI and localization coverage passed **207
  tests across 30 specs**. This includes read retry,
  malformed/empty input, state and coordinate validation, locked and logical
  object conflicts, stale plans, cancellation, exact History restore, verified
  1.21.1 golden NBT, semantic block entities, unsupported data/version, and
  prompt source/version contracts.

## Structure JSON export

- In the Vietnamese export dialog, a valid original snapshot downloaded and
  parsed as 10 blocks and 3 decorations. A valid edited draft downloaded with
  the edited name while the saved snapshot and project metadata stayed intact.
- Invalid draft output showed the validation error and produced no edited
  download. The guard still allowed the valid original. Cancel returned focus
  to Download; Revert restored the original draft and cleared dirty state.
- A new component regression test verifies warnings for opaque block entity
  data and raw decoration metadata that Structure JSON cannot preserve. The
  Vietnamese limitation text now uses correctly accented copy. The component
  and localization specs passed **20 tests** together and the component spec
  passed **6 tests** after the raw metadata case was added.

## Other supported output and AI paths

The earlier F4 browser check verified standalone NBT and datapack downloads,
invalid namespace feedback and the 390 px layout. F9's production tests also
cover the exact archive path/bytes, UTF-8, unsupported input, format/version
gates and the independent Java 1.21.1 golden fixture. F4's 320 px browser pass
covered Describe, Content, Limits, Guide and Example; F9 ran the prompt builder,
copy failure, source/version and canonical example specs.

Minecraft NBT import remains unsupported and is explained in Help; no parallel
import action was added. NBT/datapack generation has no in-progress user
cancellation control; Cancel closes the dialog before generation.

At the time of F9, the final automated test, production build, typecheck,
formatter, and encoding gates passed. G10 later closed the real nonblocking Mod
warning-fixture gap; G11 verifies the official client fallback with a genuine
Mojang archive. The combined final audit is recorded in the current renovation
inventory after A7, G10 and G11.
