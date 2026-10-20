# Block Browser Grid/List

Current P2 contract. This changes only Block Browser presentation and its direct
UI dependencies; project format, placement, history and renderer behavior are
unchanged.

## Discovery and actions

Search keeps the existing name, namespace and registry-ID semantics. A source
dropdown lists All, Vanilla and each imported source with its complete catalog
count. The result count reflects both query and source. Manage sources has a
labeled settings button rather than an ambiguous plus icon.

Grid is the initial local view. Its columns respond to sidebar width and font
size; each card has a large preview, two-line name, visible selection, and
separate 40 px information/Quick Add targets below the preview. List retains
56 px rows at the normal font size, with 40 px previews, names, exact registry
ID text and the same actions. Larger fonts increase the virtual row size.

Changing Grid/List keeps the query, source and active placement state. No new
persisted preference is introduced. Clicking Quick Add or Item details does not
select a material. Quick Bar continues to own its capacity, duplicate checks,
item identity and shortcuts.

Information and Quick Add use matching quiet 16 px tonal surfaces inside
separate 40 px hit areas. Their hover treatment stays borderless, keeping the
controls light while the targets remain easy to use by touch. Grid groups them at the trailing edge below the preview;
List keeps the same actions alongside the material. Their targets do not overlap
the selection button. A check beside the selected material name and a leading
edge marker reinforce selection in every theme. Raccoon adds soft, matte shapes
while retaining the shared layout and interaction contracts.

Quick Bar material names use one connected overlay owned by Quick Bar. Hover,
keyboard focus and touch activation expose the full name and canonical item ID
outside the scrolling slot container. The overlay stays within the viewport,
supports pointer travel to its content and Escape/outside dismissal, and is
removed when its slot disappears, the bar collapses or the component is destroyed.
It derives content from the existing entries without preparing new thumbnails.
Catalog action tooltips keep their existing implementation.

Item details is an explicit, single dialog outside the virtual rows. It exposes
the full item ID, a distinct block ID when mapped, and source; readonly ID fields
support manual selection/copy. Copy item ID copies the canonical item identity
and reports success or a manual-copy recovery. Selecting its preview uses the
existing selection path. There is no permanent active-material summary to
duplicate the Placement Inspector or Status Bar.

## Keyboard and responsive behavior

Grid/List and source controls retain focus on their triggers. Catalog preview
buttons use a roving tab stop: arrows move across items/rows; Home/End reach the
first/last result. Navigation scrolls and focuses results beyond the materialized
range. Each rendered item's information and Quick Add buttons are also reachable
with Tab. Resize preserves the logical scroll anchor, and retains catalog focus
when row grouping changes. Search/filter changes reset the result range without
moving focus away from search.

The native details dialog owns focus and backdrop. Escape closes only this
dialog, including inside the narrow Blocks drawer, and returns focus to its
trigger. Grid/List share all four themes, EN/VI and existing font tokens; reduced
motion omits the short hover transition. Empty search and fatal asset recovery
keep their existing clear/retry/manager actions; restoration can retain catalog
fallback previews while resources become ready.

## Ownership and bounded work

| Responsibility              | Owner and invariant                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog/filtering/selection | Existing BlockLibrary and placement services; catalog revision invalidates results even when the source stays All                                                                               |
| Layout                      | `block-catalog-layout`: column count, fixed row sizes, numeric virtual row indices and keyboard targets                                                                                         |
| Browser                     | One CDK viewport virtualizes rows in both modes; visible slots reference the same result array without copying item objects or slicing in templates                                             |
| Item presentation/actions   | One `BlockCatalogItemComponent` serves Grid, List and explicit details; metadata/ID parts/Quick Add availability/thumbnail URLs are computed per materialized item                              |
| Resize                      | One ResizeObserver is disconnected on teardown; width changes only regroup rows at column boundaries, not on every pixel                                                                        |
| Thumbnail work              | Existing runtime cache, task priority, deduplication, cancellation and URL ownership remain authoritative; no renderer or queue is recreated on view changes                                    |
| Recycled views              | Visibility directive requests a changed item key only when its retained priority is visible/prefetch; hidden views wait for intersection, and shared observers unobserve/disconnect on teardown |

There is no Angular node per project block, no scan of project blocks, and no
work added to the editor frame loop. Catalog work scales with changed catalog
results and the bounded rendered range.
