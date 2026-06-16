# NexusViewer — Next-Gen Markdown Viewer

A minimal, developer-focused Markdown viewer and editor built with React, TypeScript, and Electron. Fuses Claude's visual minimalism with Open Code's developer-centric power.

![Welcome screen](docs/screenshots/welcome.png)

## Features

- **Live preview** with synchronized scroll between source and rendered output
- **YAML frontmatter** parsing and metadata display
- **GFM support** (tables, task lists, strikethrough) via `remark-gfm`
- **Syntax-highlighted code blocks** via Prism with one-click clipboard copy
- **Project-root sandboxing** — every file operation is constrained to the folder you choose
- **Auto-save** (debounced) with manual save fallback
- **Light / Dark mode** (Obsidian palette in dark, Ivory in light) — persisted across launches
- **File watching** — external changes auto-reload or prompt to reload
- **Keyboard-driven, no telemetry, no cloud**

## Stack

- React 19 + TypeScript
- Vite 8
- Electron 42 (preload-based IPC, context-isolated, sandboxed)
- Tailwind CSS 4 (custom Obsidian / Ivory / Neon theme tokens)
- `react-markdown` + `remark-gfm` + `react-syntax-highlighter`
- chokidar for live file watching

## Quick Start

```bash
npm install
npm run dev              # Vite dev server
npm run electron:start   # Production build + Electron
npm run electron:build   # Portable Windows build (dist_electron_v4/)
```

## Screenshots

| Welcome (dark) | Welcome (light) | About (light) |
| --- | --- | --- |
| ![Welcome](docs/screenshots/welcome.png) | ![Welcome light](docs/screenshots/welcome-light.png) | ![About light](docs/screenshots/about-light.png) |

Light mode uses a warm off-white paper (`#f3efe6`) with `#3a3631` ink for body text — softer than pure white, inspired by Typora Claude and Flexoki paper palettes.

## Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Open folder | `Ctrl+O` |
| New file | `Ctrl+N` |
| Save | `Ctrl+S` |
| Find | `Ctrl+F` |
| Find & replace | `Ctrl+H` |
| Bold selection | `Ctrl+B` |
| Italic selection | `Ctrl+I` |
| Insert link | `Ctrl+K` |

Editor-formatting shortcuts only trigger when the editor pane is focused, so they won't fight with system shortcuts elsewhere.

## Security Model

The renderer can only read and write files inside the folder you choose via the **Open Folder** button. Any IPC call that resolves outside that root returns `{ success: false, error: 'Path is outside the project root' }`. The renderer runs with `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. External URLs opened via the About dialog are whitelisted to `https://` only.

## Generating the Logo

```bash
py scripts/generate_logo.py   # writes src/assets/logo.svg + build/icon.{png,ico}
```

## License

MIT — see [LICENSE](./LICENSE).

## Author

[ZachDreamZ](https://github.com/ZachDreamZ)
