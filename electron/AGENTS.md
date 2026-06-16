# electron

## Purpose
Main process, preload bridge, and custom protocol handler for the NexusViewer Electron host.

## Ownership
Agent

## Local Contracts
- `main.cjs` (CommonJS) is the main process entry. It registers privileged schemes, IPC handlers, and the watcher.
- `preload.cjs` (CommonJS) bridges IPC into a `window.electron` global via `contextBridge`.
- `preload.d.ts` (TypeScript) types the `window.electron` surface and the `WatcherEvent` shape for the renderer.
- All filesystem access goes through `resolveSafePath` (in `main.cjs`) to enforce the project-root sandbox.

## Work Guidance
- `protocol.registerSchemesAsPrivileged(...)` MUST run before `app.whenReady()` (at module load).
- `protocol.handle(...)` MUST run **after** `app.whenReady()` — registering it at module load throws "Session can only be received when app is ready". Wrap the registration in a function and call it inside `app.whenReady().then(...)`.
- IPC handler names must match across `main.cjs`, `preload.cjs`, and `preload.d.ts`. New IPC = update all three.
- `open-external` is gated to `https?://` URLs only — never let the renderer open arbitrary protocols (no `file://`, no `javascript:`).
- Prefer `await window.electron.foo()` from the renderer rather than touching `fs` or `path` directly (the renderer is sandboxed).
- The chokidar watcher reuses `ignoreInitial: true` and an explicit ignore regex list; the same names also appear in `findDefaultMarkdown`'s `skip` set for the initial tree walk.

## Verification
- `npm run build` must pass (TypeScript and Vite both clean).
- `npm run lint` must pass with zero errors and zero warnings.
- Manual smoke: launch app, confirm window title is "NexusViewer | Next-Gen Markdown Viewer", choose a folder, open + edit a file, see live preview, save, right-click file in tree to reveal, open external image via `nexus-asset://`.

## Child DOX Index
None
