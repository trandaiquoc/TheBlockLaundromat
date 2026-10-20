# Checkpoint G1 — Asset Manager tab intent

Local implementation evidence, 2026-10-20. The asset tab previously read
“Minecraft Versions”, although it manages vanilla assets for the active project
version and does not select versions. The tab now reads “Vanilla” in both
locales; the active Minecraft version remains visible in the tab content. This
also keeps the two tabs balanced at narrow widths.

The focused localization and Asset Manager component tests passed (19 tests).
The broader Asset Manager workflow/component and mod importer set passed (40
tests). Localhost at 390 CSS pixels showed the concise tab label, a 828 px
bounded dialog, and no document-level horizontal overflow. No production mod
JAR fixture was available in the local workspace, so its real-archive preflight
and imported-details states remain to be verified in G; source and test coverage
were reviewed for those branches.
