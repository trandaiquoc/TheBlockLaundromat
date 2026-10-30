# Documentation

## Current contracts

- [Requirements baseline](MinecraftBuilder_Requirements_VI.docx) — original MVP scope; current code and the contracts below describe implemented behavior.
- [Minecraft assets](minecraft-assets.md) — asset sources, supported formats, cache policy, and audit procedure.
- [Verified vanilla behavior](vanilla-behavior-golden-1.21.1.md) — Java 1.21.1 behavior matrix and editor-policy deviations.
- [Structure NBT contract](minecraft-structure-nbt-1.21.1.md) — exporter, entities, and datapack packaging.
- [Structure JSON contract](structure-json.md) — public shape, validation, and import semantics.
- [Renderer baseline](renderer-baseline.md) — viewport lifecycle, diagnostics, and benchmark contract.

## Homepage references

These four original images remain the visual references for the Homepage:

1. [Minecraft](design/references/01-minecraft.png)
2. [Light](design/references/02-light.png)
3. [Raccoon](design/references/03-raccoon.png)
4. [Dark](design/references/04-dark.png)

The application does not load these `Docs/` images directly. Its existing source asset package remains under `Frontend/source-assets/homepage/`. The illustrated rebuild has a [Phase1 baseline](design/homepage/phase1/README.md) and [locked Phase2 art direction](design/homepage/phase2/README.md); new concept images there are references, not runtime scenes.

## Local audit output

Reproducible vanilla coverage reports and temporary audit files belong under the ignored `.artifacts/` directory, outside canonical documentation.
