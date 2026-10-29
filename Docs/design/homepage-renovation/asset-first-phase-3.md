# Homepage asset-first redesign: Phase 3 progress

**Status: in progress — rounds 001 and 002 rejected by Codex; round 003 received Check PARTIAL; round 004 design PASS, final alpha verification pending.**

The user explicitly started Phase 3. The sample set is raccoon, washer, project
board and plant. Each asset requires a first review by Codex and a second review
by Check using the actual original file. Figma composition follows in Phase 4.

## Raccoon master — round 001

- Check revised the Phase 2 style after inspecting screenshots of the user's
  Instagram references and the original brand logo. It recommends natural dark
  outlines, soft irregular forms, subdued warm colors, flat shading and very
  subtle texture. Numeric proportions and colors remain provisional.
- Check supplied the prompt in the [Check conversation](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-cobblemon/c/6ae2cfac-70bc-83ec-9d1d-6f76fe67ed65).
  Codex sent that prompt unchanged to [Generate](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-cobblemon/c/6ae2cfba-cd7c-83ec-a171-05d99fc0ec5a),
  with the extracted original logo PNG and screenshots of both reference posts.
- Original file: `.artifacts/homepage-redesign/candidates/raccoon-master/round-001/original.png`;
  SHA-256 `ce606a4257d1f587fc4269030b466129f292e68a92401388bdedd909edd5d79e`;
  1254 × 1254 RGBA with actual transparency. This ignored local artifact is not
  a backup.
- Codex first review: **FAIL**. Anatomy and silhouette are complete, but large
  glossy pupils, prominent tufts and heavy high-contrast outlines make it look
  like a commercial mascot rather than the softer reference. The alpha channel
  contains stray low-opacity pixels near the image edges. Check has not reviewed
  this failed file. Generate was asked to produce round 002 with smaller pupils,
  softer forms and outlines, restrained flat shading and clean transparent edges.
- Round 002 original: `.artifacts/homepage-redesign/candidates/raccoon-master/round-002/original.png`;
  SHA-256 `8b58ff16854d7479b7806f3d520f6df773b9ed3308def8ca0b8558ae0bcc335b`;
  1375 × 1144 RGBA with transparency. Codex first review: **FAIL**. The
  palette and texture moved closer to the reference, but the bent arms merge
  into the belly, limbs are ambiguous at thumbnail size, and head fur remains
  too spiky. Check has not reviewed this file. Generate has been asked to make
  a new neutral standing pose with separated arms and feet, clean silhouette
  and full visible tail for round 003.
- Round 003 original: `.artifacts/homepage-redesign/candidates/raccoon-master/round-003/original.png`;
  SHA-256 `dbe62af57a3080d5f332e6c676bf4523ce30f4fc0bf29a03ce6fec7cfb16611a`;
  1254 × 1254 RGBA. Codex first review: **PASS to Check review**. It has a
  complete silhouette, visible limbs and tail, subtle texture, no props or
  scene. Check's second review: **PARTIAL**. It requests at least 5% safe
  transparent margin on every side, a tail reduced by about 10%, and a small
  natural eye highlight. Alpha inspection found sparse low-opacity pixels at
  the canvas edge although the solid silhouette has ample margin; the round 004
  prompt explicitly asks Generate to clean these stray pixels and add padding.
- Round 004 original: `.artifacts/homepage-redesign/candidates/raccoon-master/round-004/original.png`;
  SHA-256 `e10c3a255e201cd5d669ec2175b3fd75dbdb6758f25047390f26c064110e6fd7`;
  1254 × 1254 RGBA. Check second review: **PASS — Artwork**, then clarified
  28 alpha=1/255 pixels outside the 5% margin are the only remaining technical
  issue. The strong silhouette has at least 5% margin on all sides. Codex
  created `.artifacts/homepage-redesign/approved/raccoon-master/round-004.png`
  by setting alpha to zero on only those 28 out-of-margin pixels; RGB and every
  other pixel were preserved. Final PNG SHA-256:
  `89ac605140da1964911d1fc4fa3f21b640018b795a79ccb446622ab778c1cbee`.
  Codex verification: 1254 × 1254 RGBA; zero non-transparent pixels outside
  the 5% safe margin. Check's confirmation of this cleaned file is pending.
