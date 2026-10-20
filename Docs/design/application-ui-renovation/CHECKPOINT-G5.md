# Checkpoint G5 — Nested Asset Manager Escape and loader limits

The real Asset Manager hierarchy now handles Escape inside Mod details and
diagnostics before the parent dialog's document listener. Escape closes only
the top overlay and restores focus to its opener. The existing confirmation
guard remains in place for Remove Mod.

Browser QA in the disposable profile used a small synthetic ZIP with
`META-INF/mods.toml` to exercise the documented Forge loader detection path.
Preflight identified Forge as unsupported, disabled Import and exposed one
blocking diagnostic. The nested diagnostic was readable at 390 CSS px with no
horizontal overflow. Escape closed only that overlay and focused its blocking
diagnostic button; the Asset Manager stayed open. The Help popover also closed
on Escape without closing the manager.

A real Cobblemon Fabric 1.8.1 JAR was imported in the same disposable profile
to exercise Mod details. Escape closed details and restored focus to its Details
button. The test mod was then removed; the imported count returned to zero.
The component Escape specs passed (9 tests), as did app typecheck and production
build. The synthetic Forge ZIP proves the UI state and loader path only; it is
not evidence of compatibility with a real Forge mod. Vanilla offline/cache
recovery was verified separately in [G6](CHECKPOINT-G6.md). Mod timeout/retry
and warning diagnostics remain in G.
