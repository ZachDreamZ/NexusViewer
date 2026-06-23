# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

- The app is called "NexusViewer".
- Design language fuses Claude's minimalism with Open Code's developer-centric power.
- Palette: Ivory light mode, Obsidian dark mode (#0b0f19).

## Child DOX Index

- .opencode/skills: Local design skills (e.g. `apple-modern-ui`).
- .opencode/vendor: Gitignored clones of third-party opencode skills/plugins referenced by opencode.json — see **OpenCode agent skills** below. Re-fetch with `npm run setup:opencode`.
- docs: Screenshots, long-form documentation, and the **feature audit / roadmap** in `docs/FEATURE_REPORT.md` (the canonical list of P0/P1/P2 work and the current light-mode refinement plan).
- electron: Main process, preload bridge, and custom protocol handler.
- scripts: Developer-side scripts — `generate_logo.py` (Pillow) and `setup-opencode-skills.cjs` (clone third-party opencode skills).

## OpenCode agent skills (local, gitignored)

The project's `opencode.json` references three skill/plugin sources on top of the local `.opencode/skills/` directory:

| Source | How loaded | What it does |
|---|---|---|
| `shadcn/improve` (GitHub) | `skills.paths` (cloned to `.opencode/vendor/improve/`) **and** `skills.urls` (opencode fetches on demand) | On-demand `improve` skill. Audits the codebase (9 categories: correctness, security, perf, tests, tech debt, deps, DX, docs, direction) and writes self-contained `plans/*.md` specs a cheaper executor model can implement. |
| `DietrichGebert/ponytail` (GitHub) | `skills.urls` (for commands) **and** `plugin` field pointing at `.opencode/vendor/ponytail/.opencode/plugins/ponytail.mjs` | Always-on "lazy senior dev" ruleset — before writing code, the agent stops at the first rung that holds (YAGNI → stdlib → platform → installed dep → one line → minimal code). The plugin adds `/ponytail` slash commands and per-mode (`lite`/`full`/`ultra`/`off`) intensity switching via `PONYTAIL_DEFAULT_MODE`. |

Both are MIT, from well-known authors (shadcn for `shadcn-ui`, single-maintainer `DietrichGebert` for ponytail). They are **read-only** at install time — the setup script clones them, no code from them runs during `npm install`. The ponytail plugin's `.mjs` runs as an opencode server plugin during sessions, injecting the ruleset into the system prompt.

Both `opencode.json` and `.opencode/` are gitignored, so a fresh clone has no skills installed. Re-fetch with:

```bash
npm run setup:opencode
```

That's `scripts/setup-opencode-skills.cjs` — a thin `git clone --depth 1` wrapper that's idempotent (skips repos that are already cloned). Restart opencode after setup so the new skills + plugin take effect.
- .github/workflows: CI workflows — `build.yml` runs lint + build on every PR/push to `main`, builds Windows (.exe portable + NSIS installer) and Linux (AppImage) artifacts, and publishes them as a GitHub Release when a `v*` tag is pushed.
- src: Renderer source root (App, main, theme persistence). `vite-env.d.ts` declares the `__APP_VERSION__` build-time constant injected by `vite.config.ts`.
- src/assets: Static assets and images.
- src/components: Reusable UI components (Layout, Editor, Preview, FileTree, FindBar, Frontmatter, AboutModal, Logo, Icons, StatusBar, Welcome, **Callout**, **Heading**, **MermaidBlock**, **Lightbox**).
- src/content: Embedded markdown content (e.g. welcome screen).
- src/context: React context modules for file state and toasts.
- src/hooks: Reusable React hooks (project, watcher, shortcuts, theme, editor).
- src/lib: Pure utility modules (tree, paths, markdown factory, cn, CodeBlock, **remarkCallout plugin**, **headings helpers**).

