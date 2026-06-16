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
  // Wait for React to mount and apply the initial theme.
  await win.webContents.executeJavaScript('new Promise(r => setTimeout(r, 1500));');

  // For the dark-mode scenes, just keep whatever's there. For the light
  // variants, swap the class. Either way, persist the choice.
  const wantDark = !isLight;
  await win.webContents.executeJavaScript(`
    if (${JSON.stringify(wantDark)}) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexusviewer.theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexusviewer.theme', 'light');
    }
  `);
  // Force a layout flush, then wait for two paint frames so the browser
  // actually applies the new class before we screenshot. Add a longer
  // settle for the `transition-colors` declarations on the surfaces.
  await win.webContents.executeJavaScript(`
    void document.documentElement.offsetWidth;
    new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  `);
  await new Promise(r => setTimeout(r, 800));

  if (baseScene === 'about') {
    await win.webContents.executeJavaScript(`
      (() => {
        const btn = document.querySelector('[aria-label="Open about and shortcuts"]');
        if (btn) btn.click();
        else console.warn('help button not found');
      })();
    `);
    await win.webContents.executeJavaScript('new Promise(r => setTimeout(r, 500));');
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
    } catch (e) {
      return new Response(`err: ${e.message}`, { status: 404 });
    }
  });

  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const distStat = await fs.stat(INDEX).catch(() => null);
    if (!distStat) {
      throw new Error(`dist/index.html not found at ${INDEX}. Run \`npm run build\` first.`);
    }
    for (const scene of scenes) {
      await captureScene(scene);
    }
    app.quit();
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
