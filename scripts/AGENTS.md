# scripts

## Purpose
Developer-side scripts. Not bundled with the app — run manually with `py.exe scripts/<name>.py` (or `python` / `python3`) from the repo root.

## Ownership
Agent

## Local Contracts
- Keep scripts Python 3.10+ compatible. Use only the standard library plus Pillow (`pip install Pillow`).
- Output paths are repo-relative so scripts work regardless of CWD.

## File-specific contracts

### generate_logo.py
- Reads: `src/assets/logo.svg` is **written** by this script (not read).
- Writes: `src/assets/logo.svg` (header/favicon SVG), `build/icon.png` (512×512 master), `build/icon.ico` (256/128/64/32/16 multi-resolution, PNG-in-ICO).
- The mark is three connected nodes forming a triangle with a central ring + dot, rendered in the brand cyan (`#00f2ff`) on a transparent background.
- The `.ico` is hand-rolled (no external library) so it stays reproducible without `pillow-ico` or `imageio`.

### capture-screenshots.cjs
- A Node/Electron script that boots a hidden `BrowserWindow`, loads `dist/index.html`, and calls `webContents.capturePage()` to write a PNG into `docs/screenshots/`.
- Scenes: `welcome` (dark, default), `welcome-light`, `about` (dark), `about-light`.
- The script sets the `dark` class on `<html>` (or removes it) BEFORE capturing, then waits for two `requestAnimationFrame` callbacks plus an 800ms settle to clear the 300ms `transition-colors` animations.
- Usage: `node node_modules/electron/dist/electron.exe scripts/capture-screenshots.cjs [scene]` — must be run **after** `npm run build` so `dist/index.html` exists.
- Output: `docs/screenshots/{welcome,welcome-light,about,about-light}.png`. Referenced from the root `README.md`.

## Verification
- Run `py scripts/generate_logo.py` and confirm `src/assets/logo.svg` + `build/icon.{png,ico}` exist and open cleanly.
- Run `node node_modules/electron/dist/electron.exe scripts/capture-screenshots.cjs` and confirm four PNGs (welcome, welcome-light, about, about-light) are written.

## Child DOX Index
None
