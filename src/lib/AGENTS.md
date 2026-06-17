# src/lib

## Purpose
Pure, framework-light utility modules. Everything here is import-safe from any component, hook, or context — no React hooks allowed (so they can be tree-shaken into a worker if we ever need one).

## Ownership
Agent

## Local Contracts
- Modules under `src/lib/` are stateless and side-effect-free.
- They never import from `react`, `react-dom`, or any context module.
- They use ES module syntax and export named functions.

## File-specific contracts

### utils.ts
- `cn(...inputs)` — class-name joiner that accepts strings, numbers, arrays, and `{ [class]: boolean }` records. Falsy values are dropped. Use this for any conditional class concatenation; never hand-roll `clsx`-style logic in components.

### tree.ts
- `FileNode` / `FileEntry` types for the sidebar tree.
- `buildTree(entries)` — maps raw `readDir` entries to a sorted tree (directories first, then alphabetical). The `children` field is `undefined` until lazily loaded.
- `updateTreeNode(nodes, path, updater)` — immutable recursive update by path. Used by the FileTree when a folder is expanded.

### paths.ts
- `resolveAssetUrl(src, currentFile)` — translates a Markdown image `src` to a `nexus-asset://` URL that the main process can serve. Handles Windows drive letters, POSIX absolute paths, and relative paths against the current file's directory. Collapses `.` and `..` segments. Skips remote URLs.

### CodeBlock.tsx
- `<CodeBlock language="…">{code}</CodeBlock>` — a Prism-highlighted code block with a hover-revealed copy-to-clipboard button. Owns its own "copied" state with a 2s auto-clear.
- Uses a typed cast `oneDarkStyle: OneDarkStyle = oneDark as unknown as OneDarkStyle` so the rest of the codebase never has to deal with `as any`.
- Lives in its own file so the markdown factory module can export only the factory function (fast-refresh friendly).

### markdown.tsx
- `createMarkdownComponents(currentFile, options?)` — returns the `components` prop for `react-markdown`. Preview passes `currentFile` for image resolution; Welcome passes `null` and `withSyntaxHighlight: false` for the read-only view.
- All component overrides share one place: `h1`–`h4`, `p`, `ul`, `ol`, `li`, `blockquote`, `table`, `th`, `td`, `hr`, `a`, `img`, and `code`.
- Inline code uses `bg-muted text-foreground` (token-based, theme-aware).

## Verification
- `npm run build` must pass.
- `npm run lint` must pass with zero errors and zero warnings.

## Child DOX Index
None
