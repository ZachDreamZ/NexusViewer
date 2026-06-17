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
- **Design tokens**: use the shadcn-style semantic utilities (`bg-background`, `text-foreground`, `border-border`, `bg-sidebar`, `bg-card`, `text-muted-foreground`, `ring-ring`, `bg-popover`). The full token catalog lives in `src/index.css` and the design contract is in `.opencode/skills/apple-modern-ui/SKILL.md`.
- **Typography**: body copy is `text-body` (13px). Use `text-caption-1` (12px), `text-callout` (14px), `text-subhead` (15px), `text-title-3` (16px), `text-title-2` (18px), `text-title-1` (22px), `text-large-title` (26px).
- **Spacing**: 4, 8, 12, 16, 20, 24, 32 — never use 11, 13, 15, 17, 19.
- **Motion**: `transition-colors duration-200 ease-out` for hover/active. Modal in uses `animate-in fade-in duration-200` + child `zoom-in-95 duration-200`.
- **Frosted glass**: surfaces like the title bar and sidebar use the `frosted` utility class which applies `backdrop-filter: blur(20px) saturate(180%)`.
- **Radius**: cards `rounded-lg` (10px), buttons `rounded-md` (8px), modals `rounded-xl` (14px).
- **Don't use `transition-all`** — only transition the properties that should change.
- **Buttons are icon-only when their meaning is universal** (auto-save, save, theme, help). Text labels stay for actions that need disambiguation (New, Open).

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
- **Header is a frosted-glass title bar** (`h-12` with the `frosted` utility). Icon-only buttons for universal actions (auto-save, save, theme, help), text labels for the primary actions (New, Open) and the primary CTA is filled with `bg-primary text-primary-foreground`.
- Subscribes to watcher events via `window.electron.onWatcherEvent`:
  - `change` on open file: auto-reloads if clean, toasts [Reload] action if dirty
  - `unlink` on open file: closes file
  - `add`/`unlink`/`addDir`/`unlinkDir`: refreshes file tree via `treeLoadId` counter-based remount key
- Passes `currentFile` (file path) to Preview for local image resolution.
- Header logo: imports `../assets/logo.svg` and renders it next to the "NexusViewer" wordmark, with a cyan drop-shadow via `filter: drop-shadow(0 0 6px var(--color-neon-cyan-glow))`.
- `wrapSelection(before, after)` correctly positions the cursor: empty selection places it between `before` and `after`; selected text places end-of-selection at `end + before.length + after.length` (just past the closing tag).

#### FileTree.tsx
- macOS-style sidebar (`w-60`) with the `frosted` utility class for the translucent background
- Recursive file system navigation
- Lazy-loads folder contents on click (no effect-based load)
- Supports opening/closing directories
- Integrates with `window.electron.readDir` IPC
- Uses a `key={treeLoadId}` remount to sync with project changes (Layout bumps `treeLoadId` only after the tree is loaded, so the FileTree's internal state picks up the populated initialNodes, not the empty array)
- **Right-click context menu** for files and directories: "Open" (files only), "Reveal in folder" / "Open in file manager" via `window.electron.showItemInFolder` and `window.electron.openPath`, **"Rename"** via `window.electron.renamePath` (uses `window.prompt`), **"Delete"** via `window.electron.deletePath` (uses `window.confirm`)
- Context menu dismisses on outside click, `Escape` key, or action
- Item rows: `py-1` (4px), selected = `bg-sidebar-accent`, hover = `bg-sidebar-accent/60`, depth = `paddingLeft = depth * 12 + 12`
- Uses `lucide-react` icons at 12–13px

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
- Wraps the textarea in a `section` with `aria-label="Source editor"` for screen-reader navigation
- Uses the `.editor-soft` class (`caret-color: var(--color-foreground); font-family: var(--font-mono); font-size: 0.8125rem; line-height: 1.6`)

#### Preview.tsx
- Rendered Markdown preview component
- Uses `react-markdown` with GFM support
- Accepts `currentFile` prop — used to resolve relative local image paths to `nexus-asset://` URLs
- Custom `img` component override rewrites local src paths (relative, absolute, and `file://`) to `nexus-asset://` for sandboxed access
- Implements Prism syntax highlighting with `oneDark` style; copy-to-clipboard keyed on `language:text[:40]`
- Wraps everything in a `section` with `aria-label="Markdown preview"` for screen-reader navigation
- `resolveAssetUrl` collapses `.`/`..` segments and emits absolute `nexus-asset://` paths; uses `where(.dark, .dark *)` semantics for the dark variant through shadcn-style tokens

#### Frontmatter.tsx
- YAML frontmatter parser and display
- Shows document metadata (title, author, date, tags)
- Collapsible panel
- `value` typed as `unknown`; renders objects via `JSON.stringify`
- Header shows field count: `{N} {field|fields}`

#### Icons.tsx
- Shared SVG icon components used by Layout, AboutModal, Welcome, StatusBar
- Each accepts `size` (number) and standard SVG props
- Exposes `GithubIcon`, `Keyboard`, `BookOpen`, `FolderOpen` — all the icons that `lucide-react` doesn't ship or that we want to control the SVG path of
- Uses `viewBox="0 0 24 24"` and `fill="currentColor"` so the icon inherits text color

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
