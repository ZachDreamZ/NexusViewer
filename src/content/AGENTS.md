# src/content

## Purpose
Static text content embedded into the NexusViewer app, loaded via Vite raw imports (`?raw`).

## Ownership
Agent

## Local Contracts
- Markdown files in this folder are bundled at build time; do not put user-supplied or runtime-mutated content here.
- Use lowercase `.md` extension so Vite's `?raw` query resolves to a string import.
- Keep individual files under 8 KB; if a content blob grows larger, split it or move to lazy loading.

## Work Guidance
- Import a content file like `import text from './foo.md?raw';` and feed it to a renderer.
- Pair each new content file with a component (typically under `src/components/`) that knows how to render it.
- Do not duplicate strings that are already in code (shortcut maps, button labels). If a value must stay in sync with the code, export it from a TS module instead.

## Verification
- `npm run build` must pass — the `?raw` import resolves to a string literal at compile time.
- Open the app with no project loaded; the welcome view should render the full markdown with proper typography, tables, code blocks, and blockquotes.

## Child DOX Index
None
