# Phase 1 Source Asset Provenance

## Source package

- Archive: `The-Block-Laundromat-Assets-Corrected.zip` (kept outside the
  repository; not copied into production).
- SHA-256: `71463ef2ec8b34a6b3646527db55328d100809203051c731fb6037b7946c0d7d`.
- 669 ZIP entries; 112,903,594 uncompressed bytes; ZIP CRC verification passed.
- All archive paths were checked for duplicates, traversal, absolute paths,
  backslashes, and symlinks before extraction.
- Package revision: `source-pixel-correction-3`; source artboard 1672 × 941.

## Imported source tree

`Frontend/source-assets/homepage/` contains 618 files totaling
55,026,645 bytes:

| Content                                  | Files | Notes                                                                                                                                                                 |
| ---------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/{minecraft,light,raccoon,dark}/` |   331 | Original layer PNGs, including all `repairs/` inferred fills.                                                                                                         |
| `masks/{minecraft,light,raccoon,dark}/`  |   282 | All delivered masks retained. The manifest references 278; four additional masks are not referenced by it and remain preserved.                                       |
| `reference/`                             |     4 | Exact copies needed to resolve the manifest's source paths. Existing canonical originals in `Docs/design/references/` were not overwritten and remain byte-identical. |
| `scene-manifest.json`                    |     1 | Single machine-readable canonical scene/layer manifest.                                                                                                               |

`Docs/design/homepage-renovation/source-assets/asset-inventory.csv` is the
human-readable inventory (331 rows). This is the only imported inventory copy.
The complete semantic design/mapping table is maintained separately in
[`../3d-asset-plan.csv`](../3d-asset-plan.csv).

The source package README, source-supplied QA records, and all 37 previews are
kept in `Docs/design/homepage-renovation/evidence/phase1-source-assets/`;
they total 54,528,426 bytes. The four source references in the source package are
manifest-resolving copies, not replacement canonical documentation images.

## Integrity checks performed

- 331 of 331 layer files match the manifest SHA-256 and native dimensions.
- All imported PNG layers and masks decoded successfully; all masks are
  1672 × 941.
- Every manifest asset path, source-reference path, and referenced mask path
  resolves. Four additional masks were identified by filename and retained.
- All four imported reference images are byte-identical to their canonical
  counterparts under `Docs/design/references/`.
- Recomposition from the delivered PNG layers and manifest was performed
  independently in memory. All four results have zero differing RGB pixels
  against the source references.
- All 37 previews were copied byte-for-byte. Three `*-source-comparison.png`
  previews (`minecraft`, `light`, `dark`) are truncated PNGs and cannot be
  decoded; they remain preserved and are not treated as usable visual proof.

## Explicit exclusions

- `reference/.02-light.png.ycYBQF` is a truncated temporary PNG, is not named
  by the manifest, and is not a canonical source. It was excluded; the valid
  `reference/02-light.png` is present and matches the existing original.
- `demo.css`, `demo.js`, `index.html`, `qa-viewport.html`, `scene-data.js`,
  `recompose.py`, `start-demo.sh`, and `start_demo.py` are standalone demo or
  tooling code, not source imagery. They were not copied into Angular's public
  production tree. `scene-data.js` duplicates the JSON manifest.
- The archive itself was not copied into the repository.

The source package's README and QA report describe its own standalone demo.
Those claims are retained as supplied historical evidence; the demo was not
executed or independently revalidated as part of this Angular Phase 1 work.
