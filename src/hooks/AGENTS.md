# src/hooks

## Purpose
Reusable React hooks. Each hook has a single responsibility and consumes only what it needs from the contexts / window API.

## Ownership
Agent

## Local Contracts
- Hooks live in their own file named `use<Name>.ts`.
- A hook must not call other hooks from inside a callback — only at the top of the function. Refs are set inside `useEffect`, never during render.
- Hooks that bridge window.electron IPC must clean up their subscriptions in the effect's return.
- Hooks that take callbacks as props must use a `ref` pattern internally so the consumer's render doesn't re-subscribe.

## File-specific contracts

### useTheme.ts
- Single source of truth for dark/light mode.
- Reads `nexusviewer.theme` from `localStorage` on init, persists back on change.
- Toggles the `.dark` class on `<documentElement>` and sets `color-scheme` (light/dark) so the native scrollbar matches.

### useProject.ts
- Owns project-root state, the file tree, the currently-selected file, and the tree-load counter.
- Exposes: `projectRoot`, `nodes`, `selectedFile`, `treeLoadId`, `setProjectRoot`, `openFile`, `closeFile`, `chooseFolder`, `newFile`, `refreshTree`.
- The `newFile` flow loops through `untitled-N.md` names until it finds a free slot, capping at 1000 attempts.
- `loadProject` clears the currently-selected file (via `useFile().closeFile()`) so the editor pane switches back to the Welcome view.

### useShortcuts.ts
- Declarative keyboard shortcut system. Each shortcut is `{ key, meta?, shift?, inEditorOnly?, handler }`.
- Skips a shortcut if the meta/shift flags don't match or (when `inEditorOnly`) the editor isn't focused.
- Calls `e.preventDefault()` before invoking the handler.

### useWatcher.ts
- Subscribes to `window.electron.onWatcherEvent` once per `projectRoot` change.
- Uses a refs-of-handlers pattern so the subscription doesn't re-bind when callbacks change on every render (which would happen with state-heavy callbacks like `onFileChange`).
- Routes `change` on the open file → reload (or "Reload" toast if dirty), `unlink` → close, tree-shape events → refresh.

### useEditor.ts
- Wraps the editor textarea ref and exposes `wrapSelection(before, after)`, `insertAtCursor(text, offset)`, `getElement()`.
- Re-applies the cursor position via `requestAnimationFrame` so React's repaint happens first.
- Used by `Layout` to implement the Ctrl+B / Ctrl+I / Ctrl+K shortcuts.

## Verification
- `npm run build` must pass.
- `npm run lint` must pass with zero errors and zero warnings.

## Child DOX Index
None
