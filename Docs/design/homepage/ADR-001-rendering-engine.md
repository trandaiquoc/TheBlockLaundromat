# ADR 001: Homepage rendering engine

- **Status:** Proposed for prototype 1; not implemented.
- **Date:** 2026-11-16.
- **Scope:** Goal 01 technical direction for the Creative Interactive Homepage.

## Context

The root route is the real Angular project screen backed by existing workflows and IndexedDB. The separate homepage preview is static layered Canvas 2D. The next design needs spatial interaction and a moving Raccoon while preserving real project operations, accessibility, four themes, EN/VI, editor behavior and deterministic route cleanup.

Three.js already powers the editor. The supplied Spatial Diorama uses procedural Three.js geometry, bespoke character motion, raycasting and DOM integration, but source inspection found no complete route teardown or performance evidence. Its engine choice is reference evidence, not the basis for ours.

## Decision

Use the existing Three.js dependency for prototype 1, procedural-first, with Angular DOM as semantic and workflow owner. Put the scene behind a route-scoped Angular host. Emit typed interaction intents to existing workflows; renderer code does not read or mutate IndexedDB, editor sessions or project documents. Use authored texture or a rigged character if art review shows procedural shapes fail the Raccoon fidelity gate.

Do not add PixiJS or combine renderers for this prototype.

## Alternatives

- **PixiJS 2.5D:** strong if layered illustration is the primary art form, but adds an engine dependency and shifts character/depth behavior to sprites and composition. Adopt only if a focused Three.js art pass fails and a Pixi spike passes the art, interaction and workflow gates with lower custom work.
- **Three.js + PixiJS:** offers both visual toolsets, but adds renderer lifecycles, coordinate/event bridges and resource ownership. Revisit only for a concrete visual requirement that Three.js plus DOM cannot meet, with measured costs.

## Consequences

- Reuses installed engine and existing expertise; no dependency change.
- Supports real depth, camera framing, character movement and object picking.
- Procedural-first is not geometry-only; Raccoon silhouette and material quality remain subject to review.
- Requires explicit lifecycle/disposal, semantic DOM alternatives, reduced-motion behavior, WebGL fallback and browser/performance verification.
- Keep the raster preview as a reference until parity is demonstrated, then maintain one production homepage path.

## Revisit conditions

Reopen the decision if the focused procedural plus bounded authored-art pass scores below 4/5 on the art gate while PixiJS meets it with less custom work, or a measured requirement cannot be met without a second renderer. Follow the [research report and gates](README.md).
