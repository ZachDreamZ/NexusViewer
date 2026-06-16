#!/usr/bin/env node
/**
 * Capture screenshots of the NexusViewer app for documentation.
 *
 * Usage:
 *   node scripts/capture-screenshots.js           # capture all default scenes
 *   node scripts/capture-screenshots.js welcome   # capture just one scene
 *
 * Outputs PNGs to docs/screenshots/.
 */
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'screenshots');
const INDEX = path.join(ROOT, 'dist', 'index.html');

const sceneArg = process.argv[2] || 'all';
const validScenes = new Set(['welcome', 'editor', 'about']);
const scenes = sceneArg === 'all' ? [...validScenes] : [sceneArg];

if (!scenes.every(s => validScenes.has(s))) {
  console.error(`Unknown scene. Valid: ${[...validScenes].join(', ')}`);
  process.exit(1);
}

async function setupRenderer() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  // Force the prebuilt dist to be the target (Vite already ran).
  const distStat = await fs.stat(INDEX).catch(() => null);
  if (!distStat) {
    throw new Error(`dist/index.html not found at ${INDEX}. Run \`npm run build\` first.`);
  }
}

async function captureScene(scene) {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    backgroundColor: '#0b0f19',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Register the nexus-asset protocol so local images resolve during capture.
  protocol.handle('nexus-asset', async (request) => {
    try {
      const url = new URL(request.url);
      let p = decodeURIComponent(url.pathname);
      if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(p)) p = p.slice(1);
      return net.fetch(require('url').pathToFileURL(p).toString());
    } catch (e) {
      return new Response(`err: ${e.message}`, { status: 404 });
    }
  });

  await win.loadFile(INDEX);

  // Inject the scene by running JS in the renderer.
  await win.webContents.executeJavaScript(`
    (async () => {
      // Wait for React to mount.
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      await wait(800);
      ${sceneScript(scene)}
      await wait(800);
    })();
  `);

  const image = await win.webContents.capturePage();
  const target = path.join(OUT_DIR, `${scene}.png`);
  await fs.writeFile(target, image.toPNG());
  console.log(`captured ${scene} -> ${path.relative(ROOT, target)}`);
  win.close();
}

function sceneScript(scene) {
  switch (scene) {
    case 'welcome':
      return `/* welcome is the default state — no project loaded */`;
    case 'editor':
      return `
        // Render the editor with a sample markdown payload.
        const ta = document.querySelector('textarea');
        if (ta) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ta, '# Sample Document\\n\\nThis is a **markdown** preview with some _emphasis_, a list, and a code block.\\n\\n- Item one\\n- Item two\\n- Item three\\n\\n\`\`\`javascript\\nconst hello = () => console.log("hi");\\n\`\`\`');
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `;
    case 'about':
      return `
        // Open the About modal by simulating a click on the help button.
        const helpBtn = document.querySelector('[aria-label="Open about and shortcuts"]');
        if (helpBtn) helpBtn.click();
      `;
    default:
      return '';
  }
}

app.whenReady().then(async () => {
  try {
    await setupRenderer();
    for (const scene of scenes) {
      await captureScene(scene);
    }
    app.quit();
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
