# Groups Panel

Current P3 presentation contract. GroupService, group membership, history,
persistence, renderer algorithms and the Group Move panel retain their existing
ownership and behavior.

## Layout and actions

- New group opens one inline name editor; Enter saves, Escape cancels. Create
  clears the search so the new active row is visible and focuses that row.
- Compact rows show the name and cached GroupService block count once. The
  selection button, visibility toggle, lock toggle and menu are sibling controls.
  Toggling a row or opening its menu does not select/deselect a group or reset
  a pending move. Active selection remains independent from structure selection.
- The selected row has a check and selected surface, hidden names have a strike,
  lock/visibility icons and pressed states describe toggles, and isolation has
  its own focus icon and dashed boundary. No repeated active-group summary.
- Search and Add selection / Remove selection / Move stay above the list in a
  sticky toolbar. Selection actions keep their existing empty/locked guards.
- Each row menu offers Rename, Isolate / Exit isolate, Delete group and Delete
  group blocks. Rename is inline and uses the existing trimmed, NFKC normalized,
  case-insensitive uniqueness contract. Empty and duplicate names show feedback;
  unchanged names close without an extra history commit.
- Delete group removes metadata and memberships, retaining content, with the
  existing immediate behavior. Delete group blocks retains metadata and asks for
  confirmation. It keeps the existing Active Group contract: its menu item is
  disabled for unselected/locked/empty groups. Confirmations cannot act on another
  project/group after the originating context changes.

## Keyboard, responsive and ownership

The existing CDK dependency owns menu positioning, arrow/Home/End navigation,
Escape, Tab dismissal and focus restoration. No custom parallel menu mechanism
is introduced. Menu Escape is consumed by CDK before editor shortcuts; inline
form Escape stops propagation so the narrow drawer remains open. Name editor
save/cancel focuses the originating row menu or New group fallback after rendering.

Move from Groups opens the existing panel and closes the narrow drawer so it
does not cover the panel. Focus enters its first offset input, or close button
for an empty group. Save/Cancel uses existing panel commands and resets; focus
returns to the Groups Move trigger on desktop or when its drawer is open; with
the narrow drawer closed it returns to the Blocks opener. The panel's algorithms,
controls and drag lifecycle are unchanged.

The same presentation uses canonical semantic tokens for all four themes,
EN/VI and all three fonts. Row and inline actions have at least 44 px targets;
hover transitions are omitted with reduced motion. Long names truncate in the
row and remain fully available in its title and inline editor.

Group counts are computed through the existing cached `groupBlockCount` API,
outside row templates. Draft input, menu and active-selection changes do not
recompute the list/counts. There is no project-block scan in a row template or
new renderer/frame-loop work. UI draft state contains only the edit target/name
and submission state; group properties and selection stay in their services.
