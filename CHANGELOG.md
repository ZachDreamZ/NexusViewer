# Changelog

## v0.1.5 (current)

- Brand refresh: NexusViewer logo, Obsidian / Ivory palette tokens
- Local image rendering via custom `nexus-asset://` protocol
- File watching: auto-reload clean files, warn on dirty changes, close on unlink
- Find & replace bar (Ctrl+F / Ctrl+H)
- New file flow (Ctrl+N) with `untitled-N.md` naming
- File tree context menu: Rename / Delete via IPC
- Status bar with GitHub author link
- About modal with keyboard shortcut reference
- Theme toggle (dark / light) with localStorage persistence
- Portable Windows build via `electron-builder`

## v0.1.0

- Initial release: split-pane Markdown editor with live preview
- GFM + Prism syntax highlighting
- Project-root sandboxed file I/O
- Auto-save (debounced) with manual save fallback
