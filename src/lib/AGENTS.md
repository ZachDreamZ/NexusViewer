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
- `options.onImageClick(index)` — fired by the `img` override when a preview image is clicked; Preview uses it to open the Lightbox at the right index.
- All component overrides share one place: `h1`–`h4`, `p`, `ul`, `ol`, `li`, `blockquote`, `table`, `th`, `td`, `hr`, `a`, `img`, and `code`.
- Inline code uses `bg-muted text-foreground` (token-based, theme-aware).
- The `code` override detects `language-mermaid` and delegates to `<MermaidBlock>`; all other languages go through `<CodeBlock>`.
- The `blockquote` override reads `node.properties.dataCalloutType` (set by `remarkCallout`) and delegates to `<Callout>`, otherwise renders a normal blockquote.
- Heading components are imported from `../components/Heading` so this file stays free of inline JSX component declarations (fast-refresh safe).

### remarkCallout.ts
- Remark plugin that transforms `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` blockquote nodes into tagged blockquotes (sets `data.hProperties.dataCalloutType`).
- Strips the marker from the first text node and the empty paragraph if the marker was the only content.
- Leaves ordinary blockquotes untouched.
- Walks the mdast tree by hand (no `unist-util-visit` import) — keep this dependency-free.

### headings.ts
- `slugifyHeading(text)` — kebab-case slug for heading IDs. Strips HTML, removes punctuation, collapses whitespace/dashes.
- `extractHeadingText(node)` — recurses into a React-node tree and concatenates all string/number leaves. Used by `markdown.tsx` to derive heading IDs from the rendered children.
- Pure functions, no React runtime imports.

## Verification
- `npm run build` must pass.
- `npm run lint` must pass with zero errors and zero warnings.

## Child DOX Index
None
