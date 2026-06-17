#!/usr/bin/env node
/**
 * Capture screenshots of the NexusViewer app for documentation.
 *
 * Usage:
 *   node scripts/capture-screenshots.cjs           # capture all scenes
 *   node scripts/capture-screenshots.cjs welcome   # capture just one scene
 *
 * Outputs PNGs to docs/screenshots/.
 */
const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'screenshots');
const INDEX = path.join(ROOT, 'dist', 'index.html');

const sceneArg = process.argv[2] || 'all';
const validScenes = new Set(['welcome', 'about', 'welcome-light', 'about-light']);
const scenes = sceneArg === 'all' ? [...validScenes] : [sceneArg];

if (!scenes.every(s => validScenes.has(s))) {
  console.error(`Unknown scene. Valid: ${[...validScenes].join(', ')}`);
  process.exit(1);
}

async function captureScene(scene) {
  const isLight = scene.endsWith('-light');
  const baseScene = scene.replace(/-light$/, '');

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    backgroundColor: isLight ? '#f6f4ef' : '#0b0f19',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  await win.loadFile(INDEX);
  await new Promise(r => setTimeout(r, 1500));

  const wantDark = !isLight;
  // Return a Promise from the injected script so we wait for the rAFs
  // before continuing. Without this, the class toggle races the
  // capturePage call and the screenshot is taken before the layout flush.
  await win.webContents.executeJavaScript(`
    (async () => {
      if (${JSON.stringify(wantDark)}) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('nexusviewer.theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexusviewer.theme', 'light');
      }
      void document.documentElement.offsetWidth;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    })();
  `);
  // Wait for oklch color transitions to fully settle (~1s end-to-end in Chrome).
  await new Promise(r => setTimeout(r, 1500));

  if (baseScene === 'about') {
    await win.webContents.executeJavaScript(`
      (() => {
        const btn = document.querySelector('[aria-label="Open about and shortcuts"]');
        if (btn) btn.click();
        else console.warn('help button not found');
      })();
    `);
    await new Promise(r => setTimeout(r, 500));
  }

  const image = await win.webContents.capturePage();
  const target = path.join(OUT_DIR, `${scene}.png`);
  await fs.writeFile(target, image.toPNG());
  console.log(`captured ${scene} -> ${path.relative(ROOT, target)}`);
  win.destroy();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'nexus-asset',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(async () => {
  protocol.handle('nexus-asset', async (request) => {
    try {
      const url = new URL(request.url);
      let p = decodeURIComponent(url.pathname);
      if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(p)) p = p.slice(1);
      return net.fetch(pathToFileURL(p).toString());
    } catch (error) {
      return new Response(`not found: ${error.message}`, { status: 404 });
    }
  });

  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const distStat = await fs.stat(INDEX).catch(() => null);
    if (!distStat) {
      throw new Error(`dist/index.html not found at ${INDEX}. Run \`npm run build\` first.`);
    }
    // The Chromium file:// loader keeps the dist file handle open even
    // after `win.destroy()`, so a second `loadFile(INDEX)` in the same
    // process fails with ERR_FAILED. Run each scene in its own process
    // and wait synchronously for it to exit so handles are released.
    for (const scene of scenes) {
      const { spawnSync } = require('child_process');
      const electronExe = process.execPath;
      const result = spawnSync(electronExe, [__filename, scene], { stdio: 'inherit' });
      if (result.status !== 0) {
        throw new Error(`Capture of ${scene} failed with exit code ${result.status}`);
      }
    }
    app.quit();
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
