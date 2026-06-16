# src

## Purpose
Source tree for the NexusViewer React renderer.

## Ownership
Agent

## Local Contracts
- The renderer runs in a sandboxed Electron window with `contextIsolation: true` and `nodeIntegration: false`. Code here can NOT import `node:fs` or any other server-side module — every filesystem action goes through `window.electron.*` IPC.
- `index.html` is the Vite entry. It boots with `<html class="dark">` and runs an inline pre-React script that sets the `dark` class on `<html>` from `localStorage.getItem('nexusviewer.theme')` to prevent a flash of the wrong theme.
- `main.tsx` mounts `<App />` inside `<React.StrictMode>`.
- `App.tsx` owns the dark/light theme state, persists it under the `nexusviewer.theme` localStorage key (values `"dark"` | `"light"`), and threads it down to `Layout`.

## Work Guidance
- All cross-cutting state (file, toasts) lives under `src/context/`.
- Static assets go in `src/assets/`; icons/scripts go in `public/` (Vite copies `public/` to `dist/` verbatim).
- `verbatimModuleSyntax: true` in `tsconfig.app.json` — use `import type` for type-only imports.

## Verification
- `npm run build` must pass.
- `npm run lint` must pass with zero errors and zero warnings.

## Child DOX Index
- src/assets: static assets and logos.
- src/components: reusable UI components.
- src/content: embedded markdown (e.g. welcome screen).
- src/context: React context modules for file state and toasts.
