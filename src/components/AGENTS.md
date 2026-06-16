# src/components

## Purpose
House reusable UI components for the NexusViewer Markdown Viewer.

## Ownership
Agent

## Local Contracts
- Use TypeScript for all components.
- Use Tailwind CSS for styling.
- Mimic existing component patterns and design language.
- Use functional components with hooks.
- Ensure components accept clear, typed props.
- Implement responsive design patterns.
- Follow semantic HTML structure.
- Refs on host elements use the React 19 `ref` prop, not `forwardRef`.
- Avoid `useEffect` for syncing props into local state — lift state up or remount via `key`.
- Surface user-facing errors and successes through the `useToast` hook; never call `alert()`.

## Work Guidance
Create new components as separate files. Ensure a clear separation between presentation and logic.

- For form/input components, use controlled state management.
- For layout components, implement accessibility best practices.
- Use consistent naming conventions (PascalCase for components).
- Implement proper TypeScript interfaces for props.
- Any IPC action that touches the filesystem MUST resolve through the project's sandboxed root (see `electron/main.cjs:resolveSafePath`).

## Verification
- `npm run build` must pass (TypeScript and Vite both clean).
- `npm run lint` must pass with zero errors and zero warnings.
- Manual smoke: open app, choose a folder, open a `.md` file, edit content, observe synchronized scroll, save (Ctrl+S), right-click file in tree → Rename/Delete, format text (Ctrl+B/I/K), find (Ctrl+F), replace (Ctrl+H), new file (Ctrl+N).

## Child DOX Index
- src/context: React context module (`FileProvider`, `useFile`, `ToastProvider`, `useToast`).

## Component Documentation

### Core Components

#### Layout.tsx
- Main orchestrator for the split-pane interface
- Handles synchronized scrolling between Editor and Preview
- Manages global state via FileContext
- Implements theme switching and auto/manual save
- Owns the **Open Folder** flow (calls `window.electron.chooseFolder`)
- Owns the **New File** flow (calls `window.electron.createFile` with incrementing `untitled-N.md` names)
- Renders an empty-state when no project root is set (the `Welcome` view doubles as onboarding)
- Hosts the **global keyboard shortcut handler** (document-level `keydown` listener):
  - `Ctrl/Cmd+N` — new file
  - `Ctrl/Cmd+S` — save current file
  - `Ctrl/Cmd+O` — open folder
  - `Ctrl/Cmd+B` — bold (wraps editor selection with `**`)
  - `Ctrl/Cmd+I` — italic (wraps editor selection with `*`)
  - `Ctrl/Cmd+K` — insert markdown link template
  - `Escape` (while About modal is open) — close it
- Editor-formatting shortcuts require the editor textarea to be focused.
- Header is intentionally compact: New + Open Folder, a divider, then icon-only Auto-save / Save / Theme / Help buttons. The "Unsaved Changes" indicator was removed from the header because the StatusBar already shows save state.
- Subscribes to watcher events via `window.electron.onWatcherEvent`:
  - `change` on open file: auto-reloads if clean, toasts [Reload] action if dirty
  - `unlink` on open file: closes file
  - `add`/`unlink`/`addDir`/`unlinkDir`: refreshes file tree via `treeLoadId` counter-based remount key
- Passes `currentFile` (file path) to Preview for local image resolution.
- Header logo: imports `../assets/logo.svg` and renders it next to the "NEXUSVIEWER" wordmark.
- `wrapSelection(before, after)` correctly positions the cursor: empty selection places it between `before` and `after`; selected text places end-of-selection at `end + before.length + after.length` (just past the closing tag).

#### FileTree.tsx
- Recursive file system navigation component
- Lazy-loads folder contents on click (no effect-based load)
- Supports opening/closing directories
- Integrates with `window.electron.readDir` IPC
- Uses a `key={treeLoadId}` remount to sync with project changes (Layout bumps `treeLoadId` only after the tree is loaded, so the FileTree's internal state picks up the populated initialNodes, not the empty array)
- **Right-click context menu** for files and directories: "Open" (files only), "Reveal in folder" / "Open in file manager" via `window.electron.showItemInFolder` and `window.electron.openPath`, **"Rename"** via `window.electron.renamePath` (uses `window.prompt`), **"Delete"** via `window.electron.deletePath` (uses `window.confirm`)
- Context menu dismisses on outside click, `Escape` key, or action

#### FileContext.tsx
- Provider component for file state (filePath, content, isDirty, autoSave)
- Debounced 2s auto-save when `isDirty` and `filePath` are set
- All IPC calls go through the global `window.electron` (typed in `electron/preload.d.ts`)

#### useFile.ts
- Hook accessor for the FileContext value
- Throws if used outside a `FileProvider`

#### StatusBar.tsx
- Bottom-of-app status display
- Shows word count, line count, and save status
- Indicates file path and encoding (UTF-8)
- Visual feedback for unsaved changes
- Right side: divider, then a `GithubIcon` + author handle (`ZachDreamZ`) that opens `https://github.com/ZachDreamZ` via `window.electron.openExternal`

#### Editor.tsx
- Markdown code editor component
- Receives `ref` as a regular prop (React 19 pattern, no `forwardRef`)
- Handles user input changes and scroll events
- Tracks line count via `split('\n')`

#### Preview.tsx
- Rendered Markdown preview component
- Uses `react-markdown` with GFM support
- Accepts `currentFile` prop — used to resolve relative local image paths to `nexus-asset://` URLs
- Custom `img` component override rewrites local src paths (relative, absolute, and `file://`) to `nexus-asset://` for sandboxed access
- Implements Prism syntax highlighting with `oneDark` style; copy-to-clipboard keyed on `language:text[:40]`

#### Frontmatter.tsx
- YAML frontmatter parser and display
- Shows document metadata (title, author, date, tags)
- Collapsible panel
- `value` typed as `unknown`; renders objects via `JSON.stringify`

#### Welcome.tsx
- First-run / no-project landing view that fills the editor+preview area
- Renders `src/content/welcome.md` via `react-markdown` + `remark-gfm`
- Shows the NexusViewer logo (imported from `../assets/logo.svg`) and an **Open Folder** CTA in the top-right; the CTA calls `window.electron.chooseFolder()` directly so users have one-click onboarding
- Uses NexusViewer typography (matches `Preview.tsx`) but omits Prism syntax highlighting and the code-copy button since the welcome is read-only
- Mounted in `Layout` when no file is open

#### FindBar.tsx
- Find-and-replace bar for the editor, triggered by Ctrl+F (find) and Ctrl+H (replace)
- Renders inside the Editor component
- Match navigation: Enter (next), Shift+Enter (previous), ArrowUp/ArrowDown
- Case-sensitive toggle via `CaseSensitive` icon button
- Replace single (`replaceCurrent`) and replace-all (`replaceAll`)
- Match count displayed as `current / total`
- Keyboard: Escape closes the bar
- Clamps match index when content changes externally to avoid out-of-bounds access

#### AboutModal.tsx
- Modal opened from the header's `?` button
- Shows: app description, full keyboard shortcut reference, GitHub author link, version, license
- Closes on X click, backdrop click, or Escape key
- Auto-focuses the close button on open for keyboard accessibility
- Uses the `GithubIcon` component (no lucide equivalent) and the shared logo

#### GithubIcon.tsx
- Tiny inline SVG component for the GitHub mark
- Exists because `lucide-react` doesn't export a `Github` icon at this version
- `fill="currentColor"` so it inherits text color; size via `className` (e.g. `w-3 h-3`)
