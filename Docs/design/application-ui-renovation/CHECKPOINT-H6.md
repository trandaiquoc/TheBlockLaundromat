# Checkpoint H6 — Issue-first diagnostics and optional renderer details

Project issues and the asset audit remain the primary diagnostics. Renderer
performance now opens with four summary values: logical blocks, renderable
blocks, draw calls and frame interval. Thirty-one additional renderer metrics
remain available in a native, keyboard-operable disclosure. The CPU hint stays
visible and distinguishes CPU submission time from GPU frame time. Renderer
collection and project issue analysis are unchanged.

Browser QA used the saved, empty disposable project and read-only asset data:

- The empty project showed zero issue groups and a clear empty result.
- The Vanilla asset audit completed with 1,060 entries: 920 real visuals, 130
  partial visuals, 10 fallback visuals, 206 full behavior, 109 partial
  behavior, 745 unknown behavior and 920 thumbnails.
- Search and severity filters remained usable. The four renderer metrics were
  visible by default, with technical metrics collapsed until opened.
- At 390 px, the dialog fit the viewport and its content scrolled without
  horizontal overflow. Escape closed the dialog and returned to the editor.
- At 320 px, the dialog fit within 8 px side margins. Expanding technical
  details displayed all 31 metrics in a two-column layout without horizontal
  overflow.

Focused diagnostics component and analysis specs passed (14 tests), and the
browser audit did not modify the project. Production build, encoding, scoped
Prettier and `git diff --check` are recorded with this checkpoint. Screenshots
stayed in `/tmp`.
