# Documentation

## Current contracts

- [Requirements baseline](MinecraftBuilder_Requirements_VI.docx) — original MVP scope; current code and the contracts below describe implemented behavior.
- [Minecraft assets](minecraft-assets.md) — asset sources, supported formats, cache policy, and audit procedure.
- [Verified vanilla behavior](vanilla-behavior-golden-1.21.1.md) — Java 1.21.1 behavior matrix and editor-policy deviations.
- [Structure NBT contract](minecraft-structure-nbt-1.21.1.md) — exporter, entities, and datapack packaging.
- [Structure JSON contract](structure-json.md) — public shape, validation, and import semantics.
- [Renderer baseline](renderer-baseline.md) — viewport lifecycle, diagnostics, and benchmark contract.

## Homepage references

These four original images are the retained homepage concept references:

1. [Minecraft](design/references/01-minecraft.png)
2. [Light](design/references/02-light.png)
3. [Raccoon](design/references/03-raccoon.png)
4. [Dark](design/references/04-dark.png)

The application does not load these `Docs/` images directly. Its source asset package remains under `Frontend/source-assets/homepage/`.

See [Creative Interactive Homepage research and prototype gates](design/homepage/README.md), [ADR 001: Homepage rendering engine](design/homepage/ADR-001-rendering-engine.md), and the [current spatial homepage concept](design/homepage/stage-2-spatial-concepts/README.md). The superseded Goal 02C look-dev package was removed at the user's direction. The locally retained Tooplate reference ZIP is tracked as a source reference; its artwork and code are not included in the new assets.

## Local audit output

Reproducible vanilla coverage reports and temporary audit files belong under the ignored `.artifacts/` directory, outside canonical documentation.
