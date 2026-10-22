# Retired Phase 2 Homepage Prototype — Historical Record

> **Retired 2026-10-22.** The experimental Three.js homepage was removed,
> including its preview route, renderer implementation, browser check, and
> public runtime images. The default application screen is the traditional
> Project Screen. This record describes past work and is not a runbook or
> current implementation contract.

## Prototype summary

The prototype used a dedicated Three.js scene owner, generated room geometry,
and selected theme-specific detail textures. Angular continued to own labels,
project actions, settings, locale, theme, and account controls. The prototype
did not own project data or persistence and did not reuse the Editor viewport
engine. It was a blockout and did not meet the visual fidelity proposed by the
retired Phase 1 design.

The scene loaded eighty source-detail copies and two generated materials from
the former public runtime directory. Those copies and generated materials were
removed during cleanup. The 331 source layers, 282 masks, four reference images,
and scene manifest remain preserved in `Frontend/source-assets/homepage/`.

## Historical verification

The removed browser check recorded theme switching, responsive layouts, route
teardown, and project workflow interactions. Its screenshots, renderer metrics,
and runtime observations described only the retired prototype; they are not
current acceptance evidence. The retained source asset checker validates the
preserved package independently of any homepage renderer.
