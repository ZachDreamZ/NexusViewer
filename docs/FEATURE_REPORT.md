# NexusViewer — Feature Audit & Roadmap

> Date: 2026-06-17  
> Scope: Competitive feature analysis for a modern Markdown viewer/editor (Obsidian, Typora, iA Writer, Bear, Ulysses, Marktext, VS Code + extensions, online viewers like trymarkdownviewer.com, mdview.io, MD View, DocsLoop).  
> Goal: identify what a "complete" markdown viewer/editor looks like in 2026, audit NexusViewer's current coverage, and produce a phased implementation plan.

## TL;DR

NexusViewer is currently a **strong local-first viewer with file-management and live preview** but is **missing several high-leverage features** that are now considered table stakes in the category:

1. **Mermaid diagrams** and **KaTeX math** — universal in 2026 viewers.
2. **GitHub-style callouts** (`> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`) — the de-facto GFM extension.
3. **Heading anchors** + **click-to-copy** + **scroll-to-anchor** — expected from any reader.
4. **Image lightbox** for embedded images.
5. **Quick Open / Command Palette** (Ctrl/Cmd+P) — Obsidian/VSC flagship UX.
6. **Multi-tab file editing** with tabs bar.
7. **Project-wide search** (Ctrl/Cmd+Shift+F) — currently we only find within one file.
8. **Outline / Table of Contents** sidebar.
9. **Print / PDF / HTML export** — Typora/Ulysses parity.
10. **Footnotes** rendering (GFM extension; we have `remark-gfm` so it likely works — needs verification).

Light mode was just refined in commit `1a43216` (warm off-white). See "Light mode refinements" section for the next pass.

---

## 1. Industry baseline — what a "complete" markdown viewer looks like in 2026

### 1.1 Rendering features (expected)

| Feature | Status across competitors | Importance for NexusViewer |
|---|---|---|
| CommonMark + GFM (tables, task lists, strikethrough, autolinks) | Universal | **Critical** — we have it via `remark-gfm` |
| Fenced code blocks with syntax highlighting | Universal | **Critical** — we have Prism + 200 langs |
| Footnotes (GFM `[^1]`) | Obsidian, Typora, MD View, mdview.io | High — verify `remark-gfm` enables it |
| **Mermaid diagrams** (```mermaid fences) | Obsidian, Typora, Marktext, MD View, mdview.io, DocsLoop | **Critical** — currently missing |
| **KaTeX / LaTeX math** (inline `$...$`, block `$$...$$`) | Obsidian, Typora, MD View, mdview.io, DocsLoop | **Critical** — currently missing |
| **GitHub-style callouts** (`> [!NOTE]`, `> [!WARNING]`) | GitHub, Obsidian, MD View | High — currently missing (blockquote only) |
| Wiki-links / `[[note-name]]` | Obsidian, Bear (Polar Bear) | Medium — would add project mode magic |
| TOC / outline (auto-generated from headings) | Obsidian, MD View, mdview.io, DocsLoop | High — currently missing |
| Heading anchors (click `#` to copy) | GitHub, MD View, Obsidian | High — currently missing |
| Image lightbox (click to expand, ←/→ navigate) | mdview.io, MD View, DocsLoop | Medium — currently missing |
| Code block copy button | Universal (GitHub, MD View, etc.) | Done — `CodeBlock` has it |
| Frontmatter parse + display | Obsidian, Hugo/Pandoc ecosystem | Done — `Frontmatter.tsx` |
| Definition lists | CommonMark 0.31+, GFM extension | Low — niche |
| Strikethrough, highlight, subscript/superscript | GFM extensions | Verify in markdown.tsx (likely partial) |
| Print-friendly styles | Typora, MD View, Bear | Medium — currently missing |
| PDF / HTML / DOCX export | Typora, Bear Pro, Ulysses, MD View | High — currently missing |

### 1.2 Editor features (expected)

| Feature | Status | Importance |
|---|---|---|
| Split-pane live preview | Obsidian, Typora, VSC, etc. | **Done** — Layout has editor + preview side-by-side |
| Find/Replace within current file | Universal | **Done** — `FindBar` with Ctrl+F, Ctrl+H |
| **Project-wide search** (Ctrl+Shift+F) | Obsidian, VSC | **High — missing** |
| **Quick Open / Command Palette** (Ctrl+P) | VSC, Obsidian | **High — missing** |
| **Multi-tab editing** | VSC, Obsidian, Bear | **High — missing** (single file at a time) |
| **Markdown formatting toolbar** | Typora, Bear, MD View | Medium — currently shortcuts only |
| **Drag-and-drop file/folder reorder** | Bear, Obsidian (partial) | Low |
| **Markdown source mode toggle** (raw / WYSIWYG / split) | Typora, Marktext | Medium — we are always split |
| Auto-save | Bear, Typora, Obsidian | **Done** — `autoSaveEnabled` toggle |
| Word/character count | Typora, iA Writer | **Done** — `StatusBar` |
| Reading time estimate | iA Writer, Bear | Low — could add |
| **Focus / Typewriter mode** | iA Writer (signature), Typora | **Medium — missing** |
| **Sync scroll** (editor → preview) | Typora, Marktext | **Done** — `handleEditorScroll` |
| **Bidirectional scroll** (preview → editor) | Typora, Marktext | Low — adds complexity |
| **Word wrap toggle** | VSC, Obsidian | Low |
| **Line numbers / minimap** | VSC | Low — we have line count |
| Spell check | VSC, Typora, Bear | Medium — browser-native only |
| Smart lists / auto-indent | Bear, Typora, VSC | Medium — needs editor upgrade |
| Bracket pair colorization | VSC | Low |

### 1.3 Project / file management (expected)

| Feature | Status | Importance |
|---|---|---|
| File tree with expand/collapse | Universal | **Done** — `FileTree.tsx` |
| Lazy-load folder contents | VSC, Obsidian | **Done** — IPC readDir on expand |
| Create / rename / delete files & folders | Universal | **Done** — IPC + right-click menu |
| **Multi-root workspace** (VSC `*.code-workspace`) | VSC, Obsidian | Low — single project root is fine |
| **Recent projects / quick-switch** | VSC, Typora | **High — missing** |
| **File pinning / favorites** | Bear, Obsidian | Low |
| **Tabs bar with close buttons** | VSC, Obsidian, Bear | **High — missing** |
| **File rename in-tree (inline edit, not prompt)** | VSC, Obsidian | Medium — we use `window.prompt` |
| **Drag-and-drop reordering** | Bear, Obsidian | Low |
| File watcher / auto-reload on external change | VSC, Typora | **Done** — chokidar + `useWatcher` |
| Auto-detect `README.md` on open | — | **Done** — `findDefaultMarkdown` |
| **Open multiple files at once** | Universal | **High — missing** (only `openFile` closes previous) |
| **Search in project** (file-name + content) | VSC, Obsidian | **High — missing** |
| `.gitignore`-style hide rules | VSC, Obsidian | **Done** — `IGNORED_WATCH` regex |

### 1.4 Export (expected)

| Feature | Status | Importance |
|---|---|---|
| **PDF export** | Typora, Bear Pro, Ulysses, MD View | **High — missing** |
| **HTML export** (standalone) | Typora, Bear Pro, MD View | **High — missing** |
| **DOCX export** | Typora, Bear Pro | Medium |
| **Copy as HTML** | Typora, Bear | Medium |
| **Open in default app** (`.md` → VS Code, etc.) | Universal | **Done** — `openPath` IPC |
| **Reveal in folder** | Universal | **Done** — `showItemInFolder` |
| Print preview / print | Typora, Bear | Medium — browser print is acceptable |

### 1.5 Theme & appearance (expected)

| Feature | Status | Importance |
|---|---|---|
| Light + Dark mode | Universal | **Done** — `useTheme` + localStorage |
| **Multiple built-in themes** (Solarized, Monokai, Dracula, etc.) | Typora, Obsidian, Bear, VSC | **High — missing** |
| **Custom CSS / theme file** | Obsidian, VSC, Bear | Medium |
| **Editor font choice** (JetBrains Mono, Fira Code, system) | VSC, Bear, Typora | Medium |
| **Preview font choice** (serif/sans/mono) | iA Writer, Bear, Bear | Medium — currently Lora only |
| **Font size adjustment** | iA Writer, Bear, VSC | Medium |
| **Line width / max-width** | iA Writer, MD View | Medium |
| **Theme by OS preference** (auto dark/light) | VSC, Bear, Obsidian | Medium |
| **Per-folder / per-workspace theme** | Obsidian | Low |

### 1.6 Other commonly-cited features

- **Git status indicators** in the file tree (VSC, Obsidian) — Low priority, requires `simple-git` or shelling out.
- **Backlinks** (Obsidian) — would need link extraction from preview; Low.
- **Graph view** (Obsidian) — visual; Low.
- **Daily notes** / templates (Obsidian) — Low.
- **AI features** (iA Writer Authorship tracking) — emerging; defer.
- **Style check** (iA Writer — filler words, clichés) — emerging; defer.
- **Plugin system** (Obsidian, VSC) — high effort; defer to v3.
- **Mobile app** (Bear, Obsidian, iA Writer) — out of scope (desktop only).
- **Cloud sync** (Obsidian Sync, Bear Pro) — explicitly out of scope (local-first ethos).

---

## 2. Current NexusViewer state — what we already have

### 2.1 Strong foundation (Phase 1-8)

- **Renderer architecture**: React 19 + Vite, TypeScript strict, Tailwind v4 with shadcn-style tokens.
- **IPC + sandbox**: every filesystem action goes through `window.electron.*`, all paths validated against `projectRoot` via `resolveSafePath`.
- **Custom protocol**: `nexus-asset://` serves local images with proper security model.
- **File management**: full CRUD on files/folders via right-click context menu, lazy-load tree, watcher, auto-save.
- **Editor**: split-pane with sync-scroll, find/replace, formatting shortcuts (Ctrl+B/I/K), `useEditor` wrap-selection API.
- **Preview**: `react-markdown` + `remark-gfm` + Prism syntax highlighting + custom component factory in `lib/markdown.tsx`.
- **Theme**: dark/light with pre-React inline script (no FOUC), Apple-modern design tokens (OKLCH, 8pt grid, frosted glass).
- **Distribution**: portable EXE + NSIS installer, 94 MB each, code-signing skipped but builds clean.
- **Welcome screen**: embedded `welcome.md` rendered as GFM.
- **About modal**: keyboard shortcut reference, GitHub link, app version.
- **Frontmatter panel**: collapsible YAML header.

### 2.2 Gaps confirmed by audit

The audit identifies **10 must-do (P0)**, **6 high-value (P1)**, and **6 nice-to-have (P2)** features missing. See the roadmap below.

---

## 3. Roadmap (phased)

### Phase 9 — Core rendering completeness (P0 — ~2-3 days)

**Goal**: NexusViewer matches the "minimum complete" 2026 viewer feature set.

1. **Mermaid diagrams** — add `mermaid` as a dynamic-import dependency, register `remark-mermaid` plugin (or hand-rolled code-block handler), lazy-load on first diagram, render via `mermaid.render()` returning SVG.
2. **KaTeX math** — add `remark-math` + `rehype-katex`, render inline `$...$` and block `$$...$$`.
3. **GitHub-style callouts** — register `remark-gfm` callout extension (or hand-rolled `> [!NOTE]` parser) → render as colored bars with icons (lucide has `Info`, `AlertTriangle`, `CheckCircle2`, `Flame`, `Zap`).
4. **Footnotes** — verify `remark-gfm` handles `[^1]`, add CSS in `markdown-body` if needed.
5. **Heading anchors** — auto-generate `id` from heading text (slugify), render `#` on hover, click-to-copy.
6. **Image lightbox** — wrap `<img>` in a dialog, click to open full-size, ESC/click-outside to close, ←/→ to navigate.
7. **PDF / HTML export** — add IPC `export-pdf` and `export-html`. PDF via `webContents.printToPDF()`, HTML via serialize `<article>` with inlined CSS.
8. **Multi-tab editing** — refactor `useFile` into a `Map<path, FileState>`, add a `TabsBar` component above the editor, support Ctrl+Tab, Ctrl+W to close, drag-reorder.
9. **Quick Open** (Ctrl+P) — command palette modal, fuzzy-search filenames in `nodes`, Enter to open, ↑/↓ to navigate, ESC to close.
10. **Project-wide search** (Ctrl+Shift+F) — new IPC `search-project(pattern, options)`, modal with result list grouped by file, click to jump, double-click to open and scroll to match.

### Phase 10 — Productivity (P1 — ~2-3 days)

**Goal**: Power-user features that elevate NexusViewer above the basics.

1. **Outline / TOC sidebar** — extract `h1`-`h6` from current doc, render sticky mini-sidebar, click to scroll. Toggleable with Ctrl+\.
2. **Theme presets** — extend `useTheme` to support `light | dark | solarized | monokai | dracula`. Each preset overrides the OKLCH tokens. Persist in `localStorage`.
3. **Editor font toggle** — persist `editorFont: 'jetbrains' | 'fira' | 'system'` in localStorage; affects `font-mono` class on textarea.
4. **Preview font toggle** — `serif | sans | mono`, affects `markdown-body` `font-family`.
5. **Focus / typewriter mode** — hide title bar + file tree + status bar; center the current line vertically. Toggle with F8 or Ctrl+Shift+T.
6. **Inline rename in file tree** — replace `window.prompt` with a contenteditable label that commits on Enter / blurs on Esc.

### Phase 11 — Polish (P2 — as time allows)

1. **Reading time** — compute and display in StatusBar.
2. **Recent projects** — persist last 5 project roots in localStorage, surface in Welcome.
3. **Auto theme by OS** — listen to `matchMedia('(prefers-color-scheme: dark)')` changes.
4. **Custom CSS** — `nexusviewer.css` file in project root applied via `<style>` injection.
5. **Print stylesheet** — `@media print` rules in `markdown-body`.
6. **Code block line numbers / line highlight** — extend `CodeBlock` to take a `highlight` prop.

### Phase 12+ — Out of scope (deferred)

- Plugin system
- Cloud sync
- Mobile app
- AI features
- Graph view / backlinks
- Git status indicators (would require `simple-git`)

---

## 4. Light mode refinements (this commit)

The previous light mode pass (`1a43216`) softened the palette to a warm off-white. The next refinements:

| Token | Current | Proposed | Reason |
|---|---|---|---|
| `--foreground` | `oklch(0.28 0.01 245)` | `oklch(0.30 0.012 245)` | Slightly darker for AAA contrast on warm off-white (currently ~7:1, push to ~7.5:1) |
| `--muted-foreground` | `oklch(0.50 0.01 245)` | `oklch(0.48 0.012 245)` | Bring contrast on small text (blockquotes, captions) from AA-Large to AA |
| `--border` | `oklch(0.88 0.008 60)` | `oklch(0.86 0.01 60)` | More visible dividers, especially in the file tree |
| `--muted` | `oklch(0.93 0.006 60)` | `oklch(0.92 0.008 60)` | Distinguish from `--sidebar` (0.93) — code blocks will look more obviously different from sidebar |
| `--ring` | `oklch(0.55 0.16 245 / 0.4)` | `oklch(0.55 0.16 245 / 0.55)` | Stronger focus ring on inputs/buttons |
| `--sidebar-accent` | `oklch(0.89 0.014 60)` | `oklch(0.88 0.018 60)` | More obvious selected file highlight |
| `--sidebar-border` | `oklch(0.86 0.01 60)` | `oklch(0.84 0.012 60)` | More visible sidebar dividers |

These are all small bumps in the same direction — slightly more contrast, slightly more definition, but still warm and not "harsh white". The aim is to land in the same neighborhood as Bear's "Solar Light" / Apple Notes / Flexoki cream paper.

---

## 5. Verification

After implementing any of the above:

- `npm run build` must pass.
- `npm run lint` must pass with zero errors and zero warnings.
- Manual smoke: open the welcome doc, scroll through, verify Mermaid + KaTeX + callouts render; click a heading anchor and verify URL fragment + scroll; click an image and verify the lightbox opens; Ctrl+P to open command palette and search for `welcome`; Ctrl+Shift+F to search the project for `markdown`; switch to solarized theme and confirm OKLCH tokens update without a refresh.

---

## 6. References

Research sources used to compile this audit:

- `https://downloadchaos.com/blog/best-markdown-editors-2026` — Typora/Obsidian/iA Writer/Bear/Ulysses feature comparison
- `https://unmarkdown.com/blog/best-markdown-editors-2026` — 2026 roundup including Bear Web beta, iA Writer Authorship tracking
- `https://markdownsyntax.com/compare` — Obsidian vs Typora side-by-side
- `https://csvmd.com/best-markdown-editors-2025/` — Zettlr/Marktext/Ghostwriter features
- `https://trymarkdownviewer.com/` — Online viewer (GFM, KaTeX, Mermaid, footnotes, callouts)
- `https://easymdview.com/docs/markdown-support/` — MD View renderer reference (CommonMark + GFM, KaTeX, Mermaid, callouts, wiki-links, footnotes, DOMPurify)
- `https://mdview.io/` — mdview.io online viewer (Mermaid, LaTeX, TOC, font/width controls)
- `https://docsloop.com/free-tools/markdown-viewer` — DocsLoop (GFM, Mermaid, KaTeX, TOC, 180+ languages)
- `https://en.wikipedia.org/wiki/Markdown` — CommonMark + GFM history
