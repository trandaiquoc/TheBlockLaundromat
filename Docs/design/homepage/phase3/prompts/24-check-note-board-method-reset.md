# Check consultation — portrait note-board geometry method reset

Do NOT review or approve an asset in this message. This is a root-cause and method consultation after three direct Generate edit attempts continued to miss the same UI geometry and transparent-edge requirements.

## User direction and accepted visual progress

The user agreed the previous portrait workstation looked like a box instead of a note board. The current v2 direction is now visibly a thin, near-frontal framed note surface with a distinct upper shelf. Preserve that note-board identity, the warm oak/cream materials, and the shared shelf for the future washer and raccoon. Do not return to the bulky workstation v1.

## Locked target geometry

At 390 CSS px viewport width, use a 370×360 composition:

- Slim shelf: `(0,8,370,16)`.
- Board frame: `(5,30,360,318)`.
- Clean face: `(11,38,348,304)`.
- Real UI rectangle: `(20,45,330,290)`, preserving 9 px horizontal and 7 px vertical margins.
- Frame rails: 6–8 units.
- Rear brackets: 5–8 units, minimal and behind the face.

The original geometry guide was attached to the earlier Generate 02 v2 prompt. Check previously wrote [the measured guide and refinement prompt](20-check-note-board-refinement.md) and [the complete v2 generation prompt](21-portrait-note-board-v2.md).

## Three failed direct edits — exact current evidence

Generate 02 is the existing conversation: https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-the-block-laundromat/c/6ae4326c-7b90-83ec-8a91-15738c9c601d

The first geometry-guided candidate was 1122×1402 RGBA. Its alpha≥8 object box was 1082×1073 px; the clean face measured about 329×282 CSS px at 370 px object width.

Direct edit 1 (`fix1`, 1172×1342 RGBA; SHA-256 `44849912683422a4a5ae3fb6216fafd883ba8e345a766e2968f803f83ca9ef04`) improved the visible rail weight but produced only about 334×294 CSS px face at 370 px width, leaving about 2 px margins around the required UI. It also had a soft shadow below the lower rail and low-alpha red fringe.

Direct edit 2 (`fix2`, 1178×1335 RGBA; SHA-256 `80497fb0d5867d2360c36fc72f8f67b6456dc5be2a0c81e5513c4d50bf182565`) had an alpha≥8 object box of 1128×1074 px. Its clean face measured about 329×281 CSS px at 370 px width. A pixel scan found 10,685 exterior pixels with alpha 1–7 and bright red fringe color.

Direct edit 3 (`fix3`, 1178×1335 RGBA; SHA-256 `89102970337b6af392ad5cc540797ba5054ba44ad9a7c337680d2046b3d3e7e1`) had an alpha≥8 object box of 1145×1101 px. Its clean face measured about 328×283 CSS px at 370 px width. A pixel scan found 17,802 low-alpha red-fringe pixels. It still misses the required face by about 20×21 CSS px. The original remains a candidate, never approved.

The current generated original can be inspected in Generate 02's latest image; current filename is “Bảng Gỗ Treo Trống Dễ Thương”. This consultation is text-only because ChatGPT reported that the account has insufficient storage for another attachment. Do not ask Generate or Check to delete old user files or clear storage.

## Request

Please identify why edits based on the combined assembly keep shrinking the clean face despite exact textual geometry, and recommend a changed generation method that can reliably guarantee the clear-face and UI measurements while preserving the accepted note-board appearance.

Consider whether the next jobs should separate the thin board/frame from the slim shelf and rear mounting supports, or use another geometry-first method. Keep the scope minimal and provide the exact next job sequence, exact reference files to attach, and a full Generate prompt for the first job. Also advise how to prevent the repeatedly measured low-alpha red fringe without programmatically retouching the production artwork.

Do not give a PASS/FAIL verdict on an image you cannot inspect. Do not lower the 348×304 face / 330×290 UI criteria, stretch output, or add a cabinet/workstation volume. The next result will return to Codex for original-file measurement before any independent review.
