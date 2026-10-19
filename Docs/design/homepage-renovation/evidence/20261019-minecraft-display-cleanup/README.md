# Minecraft Washer Display Cleanup

## Check

- Browser: Chrome headless with DevTools Protocol against the Angular dev server.
- Viewport: 1672 × 941, device scale factor 1.
- Theme: Minecraft (`craft` internal key).
- Project: `Lakeside Cabin`, created through the actual Project Screen workflow in a disposable browser profile.
- Screenshot: [Craft display browser check](craft-display-browser-1672x941.png).

The baked `Selected Project / Lakeside Cabin` copy is removed only in the measured text mask. The plate shape, pencil artwork, and all pixels outside that mask remain from the approved reference. The live selected-project label and project name are positioned over that source plate; the display occupies `(508.28, 395.22)` to `(700.55, 442.27)` CSS pixels at this viewport.

The browser reported no failed image requests, JavaScript exceptions, console warnings/errors, or unavailable image elements during this run.

The [empty-project preview check](craft-empty-preview-browser-1672x941.png)
captures the Craft scene after reload with no saved project. The scene now keeps
an opaque preview well mounted independently of the optional preview component,
so the sample cottage baked into the source image is hidden and the dark grid is
visible. The fallback occupies `(535.03, 471.44)` to `(827.63, 767.84)` at this
viewport. The browser reported all four Craft scene images loaded and no
exceptions, console warnings/errors, or failed requests.

## Limits

These are focused Craft washer display and empty-preview checks. No populated
renderer thumbnail was available in the empty-state browser profile, so real
washer-preview rendering remains unverified. The rest of the Minecraft scene
still contains baked artwork/UI and has not passed full static-scene acceptance.
Light, Raccoon, and Dark reconstruction remain open.
