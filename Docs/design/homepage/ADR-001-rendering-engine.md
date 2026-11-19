# ADR 001: Homepage rendering engine

- **Status:** Three.js remains selected for the isolated Goal 02 preview. Goal 02E loads the supplied assembled laundromat GLB and its four material variants on `/mini-diorama-preview`; at the user's direction, `/` remains unchanged. The former Puddlepaw candidate is no longer used, and its source files were removed. Production adoption remains open.
- **Date:** 2026-11-16.
- **Reviewed:** 2026-11-17.
- **Scope:** Goal 01 engine decision; Goal 02 applies that decision to a separate, non-production preview route.

## Context

The root route is the real Angular project screen backed by existing workflows and IndexedDB. The separate homepage preview is static layered Canvas 2D. The next design needs spatial interaction and a moving Raccoon while preserving real project operations, accessibility, four themes, EN/VI, editor behavior and deterministic route cleanup.

Three.js already powers the editor. The supplied Spatial Diorama uses procedural Three.js geometry, bespoke character motion, raycasting and DOM integration, but source inspection found no complete route teardown or performance evidence. Its engine choice is reference evidence, not the basis for ours.

Goal 02 is limited to a separate presentation-only route: it does not integrate Project workflows or claim production parity.

## Decision

Use the existing Three.js dependency for the isolated preview, procedural-first, with Angular DOM as the owner of semantic controls and preferences. Put the scene behind a route-scoped Angular host. The current preview emits typed presentation intents only; it does not integrate Project workflows or read/write IndexedDB, editor sessions, or project documents. Use authored texture or a rigged character if independent art review finds procedural shapes fail the Raccoon fidelity gate.

Do not add PixiJS or combine renderers for this prototype.

## Alternatives

- **PixiJS 2.5D:** strong if layered illustration is the primary art form, but adds an engine dependency and shifts character/depth behavior to sprites and composition. Adopt only if a focused Three.js art pass fails and a Pixi spike passes the art, interaction and workflow gates with lower custom work.
- **Three.js + PixiJS:** offers both visual toolsets, but adds renderer lifecycles, coordinate/event bridges and resource ownership. Revisit only for a concrete visual requirement that Three.js plus DOM cannot meet, with measured costs.

## Consequences

- Reuses installed engine and existing expertise; no dependency change.
- Supports real depth, camera framing, bounded character poses and object picking.
- Procedural-first is not geometry-only. The Goal 02B Raccoon and room art were rejected by the user. The old Goal 02C look-dev package was removed at the user's direction; current composition and source-only Raccoon assets are documented in [Stage 2](stage-2-spatial-concepts/README.md).
- The shared Three.js scene has palette, lighting, window landscape, and exterior mood variants for Minecraft, Light, Raccoon, and Dark. Goal 02C theme concepts were historically approved; detailed material and 3D alignment decisions for the current room are deferred to the next scene review.
- The preview implements explicit lifecycle/disposal, semantic DOM alternatives, reduced-motion behavior, WebGL fallback, and browser verification. The candidate Raccoon uses GLTFLoader and AnimationMixer. Representative-device performance and formal art review remain open; the current art review is Gate A only.
- Keep the raster and diorama previews separate until production parity is demonstrated, then maintain one production homepage path.

## Revisit conditions

Reopen the decision if the focused procedural plus bounded authored-art pass scores below 4/5 on the art gate while PixiJS meets it with less custom work, or a measured requirement cannot be met without a second renderer. Follow the [research report and gates](README.md).
