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
- Manual smoke: open the welcome doc and confirm the example callouts (`> [!NOTE]` etc.) render as colored admonitions, the example math (`$E=mc^2$` and the `$$...$$` block) renders via KaTeX, the example Mermaid flowchart renders as SVG, hovering a heading reveals a `#` anchor, and clicking an image opens the Lightbox with ←/→ to navigate.

## Child DOX Index
- src/context: React context module (`FileProvider`, `useFile`, `ToastProvider`, `useToast`).

## Component Documentation

### Core Components

#### Layout.tsx
- Top-level orchestrator. Composes the title bar (extracted as `TitleBar`), the FileTree, the editor + preview main area, the StatusBar, and the AboutModal.
- Pulls **all** project state through the `useProject()` hook and all editor selection through `useEditor(ref, onChange)`.
- Subscribes to global keyboard shortcuts through `useShortcuts` and file-system events through `useWatcher`. The watcher uses a refs-of-handlers pattern internally so re-renders don't re-subscribe.
- The title bar (`TitleBar`) is a sub-component in the same file. It owns: dark-mode toggle, auto-save toggle, new / open / save / help buttons, project path label.
- Header buttons: New + Open Folder are text+icon; Auto-save / Save / Theme / Help are icon-only (32×32). The Open Folder button is the only `bg-primary` CTA in the header.
- The `HeaderButton` sub-component takes `iconOnly` (sizing), `variant: 'default' | 'primary'` (coloring), `active` (auto-save toggle), and optional `aria-pressed`.

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
- Uses `react-markdown` with `remark-gfm`, `remark-math`, `remarkCallout`, and `rehype-katex` for GFM tables, math, callouts, and Mermaid/KaTeX rendering
- Delegates all `components` overrides to `createMarkdownComponents(currentFile, options)` in `src/lib/markdown.tsx` — Preview doesn't own any inline component overrides
- Accepts `currentFile` prop — used to resolve relative local image paths to `nexus-asset://` URLs
- Accepts `scrollRef` prop — Layout passes the preview scroll ref so sync-scroll targets the actual scrollable container, not the outer wrapper
- Hosts the `<Lightbox>` state: extracts image sources from the raw markdown via regex (both `![alt](src)` and `<img>` forms), opens the lightbox at the clicked index
- Wraps everything in a `section` with `aria-label="Markdown preview"` for screen-reader navigation

#### Frontmatter.tsx
- YAML frontmatter parser and display
- Shows document metadata (title, author, date, tags)
- Collapsible panel
- `value` typed as `unknown`; renders objects via `JSON.stringify`
- Header shows field count: `{N} {field|fields}`

#### Logo.tsx
- Renders `src/assets/logo.svg` with the brand-cyan drop-shadow.
- Two sizes: `size={22}` (default, header + about modal) and `size={64} large` (welcome screen).
- Centralizes the `drop-shadow(0 0 Npx var(--color-neon-cyan-glow))` style so the magic number lives in one place.

#### Icons.tsx
- Shared SVG icon components used by Layout, AboutModal, Welcome, StatusBar
- Each accepts `size` (number) and standard SVG props
- Exposes `GithubIcon`, `Keyboard`, `BookOpen`, `FolderOpen` — all the icons that `lucide-react` doesn't ship or that we want control over the SVG path of
- Uses `viewBox="0 0 24 24"` and `fill="currentColor"` so the icon inherits text color

#### useShortcuts hook (in src/hooks/)
- Declarative keyboard shortcut registry. Each entry is `{ key, meta?, shift?, alt?, inEditorOnly?, description, handler }`.
- The Layout component owns the registry; this file is the implementation.

#### useProject hook (in src/hooks/)
- All project-root / file-tree / selected-file state lives here.
- Returns the public API used by Layout (`setProjectRoot`, `openFile`, `closeFile`, `chooseFolder`, `newFile`, `refreshTree`) and the display state (`projectRoot`, `nodes`, `selectedFile`, `treeLoadId`).
- The `newFile` flow loops `untitled-N.md` up to 1000 attempts to find a free name.

#### useWatcher hook (in src/hooks/)
- Subscribes to `window.electron.onWatcherEvent` once and routes:
  - `change` on the open file → reload (or toast [Reload] if dirty)
  - `unlink` on the open file → close
  - tree-shape events → refresh
- Uses a refs-of-handlers pattern internally so consumer re-renders don't re-bind the IPC subscription.
- Reads refs inside the callback (not at effect setup) to avoid stale closures for `selectedFile` and `isDirty`.

#### useEditor hook (in src/hooks/)
- Wraps the editor textarea ref and exposes `wrapSelection(before, after)`, `insertAtCursor(text, offset)`, `getElement()`.
- Used by Layout to implement Ctrl+B / Ctrl+I / Ctrl+K.

#### useTheme hook (in src/hooks/)
- Single source of truth for dark/light mode. Reads `nexusviewer.theme` from `localStorage`, persists on change, toggles `.dark` on `<documentElement>`.

#### Welcome.tsx
- First-run / no-project landing view that fills the editor+preview area
- Renders `src/content/welcome.md` via `react-markdown` + `remark-gfm` + `remarkCallout`
- Shows the NexusViewer logo (via `<Logo size={64} large />`) and an **Open Folder** CTA in the top-right
- Accepts `onChooseFolder` prop — Layout passes `project.chooseFolder` so the button correctly updates React project state
- Uses `createMarkdownComponents(null, { withSyntaxHighlight: false })` — the welcome view skips Prism to keep things lightweight (read-only, no copy buttons)
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

#### Callout.tsx
- Renders GitHub-style admonitions (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION`).
- The `type` prop maps to an icon (`Info` / `Lightbulb` / `Megaphone` / `AlertTriangle` / `Flame`) and a label.
- Wraps content in `<aside data-callout-type="…">`. Color comes from `index.css` rules keyed on the same data attribute.
- Receives children from the `blockquote` override in `lib/markdown.tsx` after `remarkCallout` has tagged the node.

#### Heading.tsx
- `Heading1`..`Heading4` — render `<h1>`..`<h4>` with a slugified `id` and a hover-revealed `#` anchor link.
- Clicking the anchor copies the URL (with `#id`) to clipboard, updates `window.history`, and smooth-scrolls to the element.
- The heading text is extracted in `lib/headings.ts` and passed in by `markdown.tsx`; this file only renders.

#### MermaidBlock.tsx
- Lazy-loads `mermaid` via `import('mermaid')` (cached module-level promise).
- Calls `mermaid.initialize({ theme, securityLevel: 'strict', fontFamily: 'inherit' })` with `theme: 'dark' | 'default'` from `useTheme()`.
- Passes custom `themeVariables` for both light and dark so diagram nodes contrast against `var(--card)`.
- Renders to a `<div class="mermaid-block">` via `dangerouslySetInnerHTML` once `mermaid.render(id, code)` resolves.
- Shows an inline error block if the diagram syntax is invalid; shows an "Rendering…" placeholder during the first load.

#### Lightbox.tsx
- Modal image viewer triggered by `Preview.tsx` when an `<img>` in the preview is clicked.
- Closes on backdrop click, X button, or `Escape`. ←/→ navigate between images in the source list.
- Caption shows the image's alt text and `index + 1 / total` when more than one image is open.
- Listens for keys via a window event listener; cleans up on close.

#### AboutModal.tsx
- Modal opened from the header's `?` button
- Shows: app description, full keyboard shortcut reference, GitHub author link, version (read from `__APP_VERSION__` build-time constant), license
- Closes on X click, backdrop click, or Escape key
- Auto-focuses the close button on open for keyboard accessibility
- Uses the `GithubIcon` component (no lucide equivalent) and the shared logo

#### GithubIcon.tsx
- Tiny inline SVG component for the GitHub mark
- Exists because `lucide-react` doesn't export a `Github` icon at this version
- `fill="currentColor"` so it inherits text color; size via `className` (e.g. `w-3 h-3`)
