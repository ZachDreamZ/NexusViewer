#!/usr/bin/env node
// scripts/setup-opencode-skills.cjs
// Clones the third-party AI-agent skills referenced by opencode.json into
// .opencode/vendor/ so the opencode runtime can load them as local paths.
//
// Why this exists: both opencode.json and .opencode/ are gitignored, so a
// fresh clone of the repo has no opencode skills installed. Running this
// script (or `npm run setup:opencode`) re-fetches them so the local agent
// matches the documented configuration.
//
// External code we pin here (read-only clones, never executed at install):
//   - https://github.com/shadcn/improve  — code-audit / planning skill
//   - https://github.com/DietrichGebert/ponytail — "lazy senior dev" ruleset

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const vendorDir = path.resolve(__dirname, '..', '.opencode', 'vendor');

const targets = [
  { name: 'improve', url: 'https://github.com/shadcn/improve.git' },
  { name: 'ponytail', url: 'https://github.com/DietrichGebert/ponytail.git' },
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const target of targets) {
  const dest = path.join(vendorDir, target.name);
  if (fs.existsSync(dest)) {
    console.log(`[setup-opencode] ${target.name}: already present at ${path.relative(process.cwd(), dest)}`);
    continue;
  }
  console.log(`[setup-opencode] ${target.name}: cloning ${target.url}`);
  execSync(`git clone --depth 1 ${target.url} "${dest}"`, { stdio: 'inherit' });
}

console.log('[setup-opencode] done. Restart opencode to load the new skills + plugin.');
