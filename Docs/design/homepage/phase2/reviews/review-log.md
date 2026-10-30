# Phase 2 visual review log

## Desktop concept v1 — Codex FAIL

Generate 01 produced a real image, downloaded via the viewer's download control as `Phòng giặt ấm cúng cùng gấu mèo.png`; copied to ignored `.artifacts/homepage-production/desktop-concept-v1.png`. Verified PNG 1672×941 RGB, opaque. Candidate is not a master or runtime asset.

Codex inspected the full actual image in the viewer and the original file. Architecture/exterior/depth, supported board and clean board/door/logo spaces were useful. However, furniture retained the polished volumetric rendering of the originals and mascot retained the older glossy/spiky-cheek brand character language. This did not unify the new reference grammar across mascot and environment. Raccoon also carried towels instead of leaving a neutral pose available.

Direct [v2 correction](../prompts/03-desktop-v2-codex-fix.md) requests a complete scene redraw in the observed shared drawing grammar while preserving successful spatial relationships, clean functional zones and architectural depth. No Check review was requested for v1 because Codex did not approve it. No phase gate passed.

## Desktop concept v2 — Codex + Check PASS, concept only

Downloaded actual original via viewer as `Xưởng giặt ấm áp bên làng quê.png`: 1672×941 RGB opaque, SHA-256 `38e24f7f38d23c76eb9924764433d8f619a6bc43ba56d7282b686bc254c59463`. Staged at `.artifacts/homepage-production/desktop-concept-v2.png` and temp transfer directory, not approved/ or runtime.

Codex inspected the full original: substantial room architecture/exterior/floor depth, clean nearly frontal supported board, circular neutral door and quiet logo wall region; matte drawn wood/enamel, simpler rounded mascot face/paws and neutral empty hands. Camera/scale/contact relationships remain coherent. The room is visibly richer and more integrated than the rejected Figma. This is a viable concept target for independent review, not proof of production asset/Figma readiness. Peripheral foliage is softer than main task objects; independent Check must evaluate style unity and clean usable zones against actual references.

The first transfer attempt changed tab context to Generate and its response correctly reported NEEDS_CONTEXT rather than reviewing v2. This was not an independent Check review and is not counted as visual evidence. Codex reopened the saved Check URL, explicitly selected the tab and verified both URL and `desktop-concept-v2(1).png` attachment in the composer, then sent the exact PNG with [review request](../prompts/04-check-desktop-v2.md). The `(1)` library filename suffix does not change its bytes.

Check 01 then returned **PASS — Concept target only** for this exact v2/hash. Its visual findings confirm room architecture/depth, coherent 2.5D camera, matte drawing language/mascot, physical contacts/support, clean logo/door/board zones and no baked UI. It requires preserving logo fit, board interior bounds and mascot identity in subsequent work. [Screenshot evidence](check-desktop-v2-pass.png). Original retained once as [desktop-concept-v2.png](../assets/approved/desktop-concept-v2.png). This is a concept reference and must never be used as a flattened runtime Homepage.

## Portrait concept v1 — Codex FAIL

Check supplied the full [portrait prompt](../prompts/05-portrait-concept-v1.md), using exact desktop v2 as primary master plus the four original rooms and three actual raccoon references. It specifies a reflowed 390×1150 CSS composition at 780×2300 resolution, upper logo/control architecture, grounded activity vignette, integrated lower board with 342 CSS px usable width, no baked UI.

Generate produced an original 730×2153 RGB PNG, downloaded through its viewer as `Phòng giặt ấm cúng cùng chú gấu mèo.png`, SHA-256 `1569e628c437c77c26d7d8cc3e18219cfca3401b53767d727e3c45688d58d85d`. Native resolution differs from request but aspect is equivalent; this alone is not a visual failure.

Codex inspected the full original. Identity/material language, clean zones and upper architecture carry over, but two separate room-floor/rug planes above and below the board make the scene read as stacked images rather than a coherent vertical space. Frame/side decoration also reduce usable board interior to roughly 300 CSS px at390, below the342 target. **FAIL**, not sent to Check.

[Portrait v2 correction](../prompts/06-portrait-v2-codex-fix.md) explicitly rebuilds one continuous oak laundry workbench/plinth: washer and mascot share its broad top, the board occupies its front vertical facade with342px usable width, structural posts descend to the one actual floor atbottom. No new portrait approval or Phase2 PASS yet.

## Portrait concept v2 — Codex revision required

Resumed 2026-10-30 and inspected the existing terminal Generate response; did not restart the previous job. Original downloaded through viewer as `Phòng giặt ấm áp bên làng quê.png`: 730×2153 RGB, SHA-256 `5ce61f01ce8808758aa33d7d3e6f4d027e970280a638c164eb79b59c652b0baa`, candidate in ignored artifacts.

One continuous supported workbench/plinth and one floor now resolve the repeated-floor defect. Character/washer identity and contacts remain coherent; board front is clean. However, shelves/window/foliage leave a narrow upper quiet-wall slot, insufficient for the real 2:1 logo at250–260 CSSpx width. Board interior is also slightly narrower than the342 CSSpx target. No independent Check review was requested. [Localized v3 request](../prompts/07-portrait-v3-codex-fix.md) widens the upper logo mounting zone and slightly thins the board frame while preserving the successful workstation and identity. Generate v3 is pending; no portrait PASS claimed.

## Portrait concept v3 — Check FAIL, upper brand-safe wall only

Original downloaded through Generate viewer as `Góc giặt là ấm áp cùng chú gấu mèo.png`: 730×2153 RGB, SHA-256 `069998781958409aa8a0564afde0b28168af07044db3e5588ee92236541e9f77`. A transient connection notice appeared after generation, but reloading the same conversation revealed a completed image; no duplicate job was started.

Codex inspected the whole original: continuous supported workbench, one bottom floor, same mascot/washer/material/light identity, clean inset/board and architectural framing/exterior. Considered viable as a concept, not a production/Figma gate. Initial nominal logo/board dimensions differ from the actual image: proposed real brand is200–220 CSSpx wide preserving2:1aspect, board usable face about330–340px at390 and272+ at320. These changes are explicitly submitted for Check's feasibility/readability assessment rather than silently treating the initial pixel proposal as met.

Sent [review request](../prompts/08-check-portrait-v3.md) with exact original v3 and unchanged clean brand PNG to the verified Check01 URL; attachment filenames verified before submit. This was the first independent review of any portrait version. Check independently accepted room continuity, shared contacts/supports, identity/material/light, blank door, usable one-column board and absence of baked UI. It rejected the logo-safe wall: actual clear width around175–195 CSSpx before padding is insufficient for the detailed unchanged brand at200–220px. The initial nominal fit adjustment therefore does not resolve the actual visual defect; no portrait or Phase2 PASS.

Check supplied [complete v4 fix](../prompts/09-check-authored-portrait-v4.md): modify only upper architecture to provide at least230×125 CSSpx clear wall, preserve all workstation/board/mascot/floor details and do not insert/redraw logo. Sent that prompt with exact v3, desktopv2 and clean brand references to verified Generate01. Await actual v4 before another exact-version review.

## Portrait concept v4 — Codex FAIL; method reset requested

Downloaded actual730×2153RGB original through viewer: `Phòng giặt ấm áp cùng gấu mèo nhỏ.png`, SHA-256 `462e56f8919ab615d62b05e556513ead9c1ca1b73be7c3e11e6d788d26fab6ef`. Original candidate retained in ignored artifacts. Upper-wall edits remain too conservative; the clear width is still inadequate for a real200–220px brand plus padding, while the successful room/workstation/board/identity qualities remain intact.

After repeated logo-region corrections across v2–v4, Codex invoked the required root-cause/method reset with Check, using [this request](../prompts/10-check-method-reset.md) plus exact v4. This is a diagnostic consultation, not an independent approval review. Proposed a physically supported blank brand plaque to provide a quiet surface without contradictory wall-boundary preservation. No lower quality threshold or v4 PASS. Await a changed method/prompt before generating again.

Check identified a geometry/preservation conflict: old window/shelf/column boundaries were held fixed while a wider safe wall was requested, and image edits preserved those contours. It chose a supported blank oak/cream hanging brand plaque, with intentional occlusion of minor background details, rather than repeating shelf nudges or reducing logo legibility. [Changed-method prompt](../prompts/11-check-authored-portrait-v5.md) requires two credible ceiling supports, a260×140CSSpx clean face and200–220px unchanged brand placed later. Sent with exact v4/desktopv2/brand references to Generate01; portraitv5 is now pending. Inventory must include this support/frame/face/shadow group if the concept passes.

## Portrait concept v5 — Codex FAIL, plaque too small

Downloaded real original via viewer: `Góc giặt là ngập nắng và cây xanh.png`,729×2156RGB, SHA-256 `1bfcc987d83defb4bc88ae32c89977d1376cf0a94fdab34040a9e7f5e18bbf1d`. The changed method produces a credible oak/cream sign and two supports without disturbing the lower room. However, its outer width is only around195CSSpx at390, so its actual inner face cannot fit the required200–220px brand. No independent Check review or approval requested.

[Codex v6 size correction](../prompts/12-portrait-v6-plaque-size.md) uses native729×2156 coordinates and requires the existing plaque to grow about1.65×, with intentional occlusion of old wall/shelf contours and a510×265native-pixel clean face (about273×142CSSpx at390). Only plaque/supports may change. Await the actual result.

## Portrait concept v6 — Codex FAIL, face height insufficient

Original viewer download `Góc giặt giũ ấm cúng cùng chú gấu mèo.png`,730×2155RGB, SHA-256 `e69fb00c8b66544cb2f86f4345e1bc320bac91bc6287290ee60d25c6571c9111`. Wider plaque now solves horizontal fit; credible supports and lower scene remain intact. Actual clear face at native y230–400 is only around170px high (about91CSSpx), confirmed visually and by center-column color samples. It cannot contain a100–110px-high logo with breathing room. Not sent to Check.

[V7 correction](../prompts/13-portrait-v7-plaque-height.md) holds the successful width/top/hangers and extends only the plaque bottom over existing empty wall, requiring a500×320native clean face. No lower objects may move. Generate v7 pending; no portrait approval.

## Portrait concept v7 — Codex concept review passed; Check pending

Downloaded actual730×2155RGB original via viewer as `Phòng giặt nắng ấm với gấu mèo đáng yêu.png`, SHA-256 `b096a6207c3d5d9fc187a7716b0c071abcb194d8f3d321e4bb874f466754a423`. Plaque now has both breadth and height, two credible connections to ceiling, clean front surface, consistent material/light and intended physical occlusion. Main workstation/character/board/floor qualities remain intact. Codex considers it viable for independent concept review.

[Exact-version review](../prompts/14-check-portrait-v7.md) includes original v7 and unchanged brand. It explicitly pins the proposed real logo at200×100CSSpx within the originally accepted200–220widthrange; actual face appears about245–255×145–150 rather than pretending the nominal260×140target was met. Check must assess actual margins/readability and may FAIL; no logo below200 or hidden waiver is allowed. First independent review of v7 is pending. No production or Figma PASS.

The first transfer failed server-side with `net::ERR_HTTP2_PING_FAILED`; its disabled Send button prevented submission. Removed failed attachments and reuploaded only the exact v7 original; verified completed attachment and enabled Send before submitting. Existing unchanged brand reference was already available in Check. No duplicate image review was sent.

Check01 independently returned **PASS — Phase2 concept target only** for exact v7/hash. It confirmed credible two-point sign support, near-frontal clean face, matching material/light, no occlusion and unchanged workstation/washer/mascot/board/floor logic. Actual face245–255×145–150CSSpx supports the pinned200×100logo with22–27px horizontal and22–25px vertical breathing room; Check explicitly did not claim the nominal260width was achieved, and accepted the actual fit without reducing brand readability. [PASS evidence](check-portrait-v7-pass.png). Original retained as [portrait-concept-v7.png](../assets/approved/portrait-concept-v7.png); [catalog](../assets/catalog.json) records exact metadata.

Check locked the concept constraints and prepared the [first Phase3 raccoon prompt](../prompts/15-prepared-raccoon-master.md), explicitly not activated until Phase2 documentation/commit/push. These approvals prove only whole-scene art direction, not production masters, exact Figma fit, live workflows, responsive implementation or animation.
