# Phase 2 — Whole-scene art direction

Status: **COMPLETE — concept/art-direction scope only**, 2026-10-30. Goal remains Phase2–11. Recommended Codex model: GPT-6.1 Sol / High; no model-switch tool is available, so current model continues without claiming a switch.

The [production specification](art-direction.md) locks camera, drawing grammar, proportions, material palette, upper-left light, desktop/portrait layouts, usable UI zones and asset/motion inventory. The [catalog](assets/catalog.json) records exact original downloads and hashes. Both desktopv2 and portraitv7 have Codex + independent Check PASS as composition references. Neither is a production master or a flattened runtime scene.

## References and acceptance

The four original rooms remain mandatory references for architecture/depth/detail: [Minecraft](../../references/01-minecraft.png), [Light](../../references/02-light.png), [Raccoon](../../references/03-raccoon.png), [Dark](../../references/04-dark.png). Selected raccoon posts actually viewed in Chrome:

- [Sword/standing proportions](https://www.instagram.com/p/De7CD3kIw15/), [evidence](../phase1/reviews/instagram-post-De7CD3kIw15.png).
- [Autumn/grounded contact](https://www.instagram.com/p/DdyRoi3I73d/), [evidence](reviews/reference-autumn.png).
- [String/rounded face and paws](https://www.instagram.com/p/De_6YBJI9gj/), [evidence](reviews/reference-string.png).

Observed traits: rounded silhouettes, soft irregular warm-brown contours, cream/gray-olive/brown forms, simple paws/eye masks/ringed tail, matte diffuse shading and restrained grain. Create an original project character; do not copy props, costumes or compositions. Furniture shares that drawing grammar.

| Gate                                             | Evidence / result                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Camera, scale, palette and lighting              | [Locked specification](art-direction.md), near-frontal2.5D, upright verticals, one light/support logic                                                             |
| Desktop complete room and clean functional zones | [Desktopv2 original](assets/approved/desktop-concept-v2.png), [Check PASS](reviews/check-desktop-v2-pass.png)                                                      |
| Portrait reflow and credible brand mounting      | [Portraitv7 original](assets/approved/portrait-concept-v7.png), [Check PASS](reviews/check-portrait-v7-pass.png); one workstation/floor and supported blank plaque |
| Original logo preserved                          | Existing clean brand SVG/embedded1774×887PNG identified in specification; contaminated old room cutout excluded                                                    |
| UI capacity and responsive strategy              | Desktop/portrait slots,44px controls, one-column/scroll/dialog rules in specification; actual Figma proof remains Phase4/6                                         |
| Production and motion breakdown                  | Environment, washer, raccoon, board, plant, plaque, tickets, contact/light layers and DOM boundary inventoried                                                     |
| Exact image provenance and review loop           | [Catalog](assets/catalog.json), [historical review log](reviews/review-log.md), prompts01–15; repeated logo-fit failure triggered Check method reset               |

## Delivery and limits

Original downloads were obtained through Generate's viewer download control and verified as opaque RGB PNGs: desktop1672×941, portrait730×2155. Screenshots in reviews/ are independent review/reference evidence only. Candidates remain ignored artifacts, outside approved/ and public/. No frontend source, runtime assets, dependencies or Figma nodes changed.

Validation: catalog existence/SHA256/dimensions/mode/alpha, local documentation links, Markdown/JSON formatting and `git diff --check`. No application build or workflow/Editor tests are claimed for this documentation/art-direction phase. Exact Figma anchors,320px readability, full EN/VI states and runtime workflows/motion are later gates. No external configuration/research blocker remains for Phase2.

The latest user instruction supersedes historical stop/model-selection wording in the [shared brief](../phase1/prompts/shared-brief.md): document, commit, push and automatically proceed. Next is Phase3 foundational masters using the [prepared first prompt](prompts/15-prepared-raccoon-master.md), then the mandatory Phase4 assembled-room gate before mass production or code. See [handoff](handoff.md).
