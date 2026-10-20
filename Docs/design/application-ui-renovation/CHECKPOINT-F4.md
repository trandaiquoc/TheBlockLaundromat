# Checkpoint F4 — Retained NBT/datapack and external AI UI

Local audit evidence, 2026-10-20. This records a KEEP decision after source,
test and browser inspection; no production implementation changed.

The NBT/datapack dialog already separates output formats, fields, live resource
identity, compatibility, install steps, validation and a persistent download
footer. At 390 px, it fit without horizontal overflow. An invalid namespace
disabled output; valid standalone NBT and datapack ZIP both downloaded with
the expected extensions. Four targeted exporter/UI spec files passed 26 tests.
Format bytes, unsupported/version states and cancellation remain in the final
checkpoint F gate.

The external AI workspace already states that it copies a prompt locally and
does not call an AI service. It separates prompt inclusion from Describe,
Content, Limits, Guide and Example viewing tabs. All five tabs were navigable
at 320 px without horizontal overflow or page errors. Existing dialog specs
cover tab navigation, content inclusion, mod selection, persisted limits,
diagnostic translation and atomic import handoff. A follow-up regression test
now verifies that rejected clipboard writes and an unavailable Clipboard API
show a failure state for the correct copy target. The F follow-up run passed
70 tests across eight import, export and AI specs. Real mod source interaction
remains in checkpoint G.
