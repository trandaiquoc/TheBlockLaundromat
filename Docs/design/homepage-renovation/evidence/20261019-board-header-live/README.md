# Craft Board Header: Live DOM Controls

This browser checkpoint verifies the measured Craft board-header cleanup at
1672 × 941 with an empty local project store. The page uses the actual Angular
Project Screen and a fresh, disposable Chrome profile.

## Captures

- [English, empty project list](craft-empty-en-1672x941.png)
- [Vietnamese, empty project list](craft-empty-vi-1672x941.png)

## Browser Checks

- The 1672 × 941 cleanup PNG loaded and covers only the baked title, search
  icon/placeholder, and sort text/caret. The parchment board surface and control
  frames remain visible.
- The localized heading, search input, and select are live DOM elements at the
  measured source positions. The heading begins at x≈1067, after the existing
  grass-block marker.
- English strings: `Recent projects`, `Search projects…`, `Newest`.
- Vietnamese strings: `Dự án gần đây`, `Tìm dự án…`, `Mới nhất`.
- The search input accepted input and the sort select changed to `Oldest` /
  `Cũ nhất` through DOM input/change events; state was restored before capture.
- Page-level CDP reported no JavaScript exception, console warning/error, or
  failed network request during either checked session.
- Chrome process stderr did report browser-level GCM registration messages
  (`DEPRECATED_ENDPOINT`, `PHONE_REGISTRATION_ERROR`, and a GCM connection
  failure) plus headless GPU/WebGPU buffer-limit reductions. These did not
  appear as page console/runtime errors and are not caused by the application.

The empty-list interaction does not prove filtering of populated cards; the
Project Screen component regression test separately verifies live filtering
and sorting with project data.
