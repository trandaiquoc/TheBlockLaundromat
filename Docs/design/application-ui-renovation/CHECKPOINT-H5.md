# Checkpoint H5 — Homepage account and responsive controls

At narrow widths, the Homepage controls now use two intentional rows: locale
and Settings on the first row, all four theme choices on the second. Desktop
keeps the existing single row. The account card and demo menu remain the same
across themes, with one local raccoon avatar and no authentication service.

Browser verification in the disposable local profile confirmed:

- Minecraft, Raccoon, Light and Dark each exposed one clearly selected theme
  button and used the same account avatar.
- English and Vietnamese labels updated. The account menu showed the matching
  `rakoon` / `Free Plan` or localized plan text, then `Log out`.
- Escape closed the menu and restored focus; clicking outside closed it.
- Logging out changed only the account presentation to Guest. The existing
  project remained visible, and reloading restored the demo account without
  changing the selected theme or locale preferences.
- At 390 px and 320 px, controls fit without horizontal overflow. The 390 px
  control panel measured 88 px tall with two rows. At 320 px, the account menu
  remained above the card and within the viewport.

Screenshots stayed under `/tmp`. The focused account and controls specs, app
production build, encoding, scoped Prettier and `git diff --check` are recorded
with the checkpoint verification.
