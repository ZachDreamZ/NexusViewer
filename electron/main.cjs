const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { pathToFileURL } = require('url');
const chokidar = require('chokidar');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'nexus-asset',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

let projectRoot = null;
let mainWindow = null;
let watcher = null;

const IGNORED_WATCH = [
  /(^|[\\/])node_modules([\\/]|$)/,
  /(^|[\\/])\.git([\\/]|$)/,
  /(^|[\\/])\.cache([\\/]|$)/,
  /(^|[\\/])\.mcp([\\/]|$)/,
  /(^|[\\/])\.opencode([\\/]|$)/,
  /(^|[\\/])__pycache__([\\/]|$)/,
  /(^|[\\/])\.venv([\\/]|$)/,
  /(^|[\\/])dist([\\/]|$)/,
  /(^|[\\/])dist_electron([\\/]|$)/,
  /(^|[\\/])dist_electron_v\d+([\\/]|$)/,
];

const FIND_DEFAULT_SKIP = new Set([
  'node_modules', '.git', '.cache', '.mcp', '.opencode', '.venv', '__pycache__',
  'dist', 'dist_electron', 'dist_electron_v2', 'dist_electron_v3', 'dist_electron_v4',
  'dist_final', 'dist_final_test',
]);

const PROJECT_ROOT_REQUIRED = { success: false, error: 'No project root set' };
const OUTSIDE_ROOT = { success: false, error: 'Path is outside the project root' };

const isValidName = (name) => {
  if (typeof name !== 'string' || name.length === 0) return false;
  if (name === '.' || name === '..') return false;
  if (name.includes('/') || name.includes('\\')) return false;
  return true;
};

function resolveSafePath(inputPath) {
  if (!projectRoot) return null;
  const candidate = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(projectRoot, inputPath);
  const normalizedRoot = path.resolve(projectRoot);
  if (!candidate.startsWith(normalizedRoot + path.sep) && candidate !== normalizedRoot) {
    return null;
  }
  return candidate;
}

function isInsideProject(safe) {
  const normalizedRoot = path.resolve(projectRoot);
  return safe === normalizedRoot || safe.startsWith(normalizedRoot + path.sep);
}

async function setProjectRoot(rootPath) {
  const absolute = path.resolve(rootPath);
  try {
    const stat = await fs.stat(absolute);
    if (!stat.isDirectory()) {
      return { success: false, error: 'Path is not a directory' };
    }
    projectRoot = absolute;
    startWatcher(absolute);
    return { success: true, root: projectRoot };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function startWatcher(rootPath) {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  watcher = chokidar.watch(rootPath, {
    ignoreInitial: true,
    ignored: IGNORED_WATCH,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });

  const send = (event, filePath) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('watcher:event', { type: event, path: filePath });
    }
  };

  watcher.on('change', (p) => send('change', p));
  watcher.on('add', (p) => send('add', p));
  watcher.on('unlink', (p) => send('unlink', p));
  watcher.on('addDir', (p) => send('addDir', p));
  watcher.on('unlinkDir', (p) => send('unlinkDir', p));
  watcher.on('error', (err) => console.error('Watcher error:', err));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
    },
    title: 'NexusViewer',
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function registerNexusAssetProtocol() {
  protocol.handle('nexus-asset', async (request) => {
    try {
      const url = new URL(request.url);
      let filePath = decodeURIComponent(url.pathname);
      if (process.platform === 'win32' && /^\/[A-Za-z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
      const safe = resolveSafePath(filePath);
      if (!safe) return new Response('forbidden', { status: 403 });
      return net.fetch(pathToFileURL(safe).toString());
    } catch (error) {
      return new Response(`not found: ${error.message}`, { status: 404 });
    }
  });
}

const handleChooseFolder = async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Choose project folder',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelled' };
  }
  return setProjectRoot(result.filePaths[0]);
};

const handleReadFile = async (event, filePath) => {
  const safe = resolveSafePath(filePath);
  if (!safe) return OUTSIDE_ROOT;
  try {
    const content = await fs.readFile(safe, 'utf8');
    return { success: true, content, path: safe };
  } catch (error) {
    console.error('File read error:', error);
    return { success: false, error: error.message };
  }
};

const handleWriteFile = async (event, { filePath, content }) => {
  const safe = resolveSafePath(filePath);
  if (!safe) return OUTSIDE_ROOT;
  try {
    await fs.writeFile(safe, content, 'utf8');
    return { success: true, path: safe };
  } catch (error) {
    console.error('File write error:', error);
    return { success: false, error: error.message };
  }
};

const handleReadDir = async (event, dirPath) => {
  const safe = resolveSafePath(dirPath);
  if (!safe) return OUTSIDE_ROOT;
  try {
    const entries = await fs.readdir(safe, { withFileTypes: true });
    const files = entries.map(entry => ({
      name: entry.name,
      path: path.join(safe, entry.name),
      isDirectory: entry.isDirectory(),
    }));
    return { success: true, files };
  } catch (error) {
    console.error('Directory read error:', error);
    return { success: false, error: error.message };
  }
};

async function findDefaultMarkdown(startDir, maxDepth = 4) {
  const walk = async (dir, depth) => {
    if (depth > maxDepth) return null;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      console.warn('findDefaultMarkdown: skipping unreadable directory:', dir, err.message);
      return null;
    }
    const readme = entries.find(e => !e.isDirectory() && e.name.toLowerCase() === 'readme.md');
    if (readme) return path.join(dir, readme.name);
    for (const entry of entries) {
      if (entry.isDirectory() && !FIND_DEFAULT_SKIP.has(entry.name) && !entry.name.startsWith('.')) {
        const found = await walk(path.join(dir, entry.name), depth + 1);
        if (found) return found;
      }
    }
    const firstMd = entries.find(e => !e.isDirectory() && e.name.toLowerCase().endsWith('.md'));
    return firstMd ? path.join(dir, firstMd.name) : null;
  };
  return walk(startDir, 0);
}

const handleFindDefaultMarkdown = async () => {
  if (!projectRoot) return PROJECT_ROOT_REQUIRED;
  const found = await findDefaultMarkdown(projectRoot);
  return found ? { success: true, path: found } : { success: false };
};

const handleShowItemInFolder = async (event, filePath) => {
  const safe = resolveSafePath(filePath);
  if (!safe) return OUTSIDE_ROOT;
  shell.showItemInFolder(safe);
  return { success: true };
};

const handleOpenPath = async (event, filePath) => {
  const safe = resolveSafePath(filePath);
  if (!safe) return OUTSIDE_ROOT;
  const err = await shell.openPath(safe);
  return err ? { success: false, error: err } : { success: true };
};

const handleOpenExternal = async (event, url) => {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return { success: false, error: 'Only http(s) URLs are allowed' };
  }
  await shell.openExternal(url);
  return { success: true };
};

const handleCreateFile = async (event, { name, content = '' }) => {
  if (!projectRoot) return PROJECT_ROOT_REQUIRED;
  if (!isValidName(name)) return { success: false, error: 'Invalid file name' };
  const safe = path.resolve(projectRoot, name);
  if (!isInsideProject(safe)) return OUTSIDE_ROOT;
  try {
    const existing = await fs.stat(safe).catch(() => null);
    if (existing) return { success: false, error: 'File already exists' };
    await fs.writeFile(safe, content, 'utf8');
    return { success: true, path: safe };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const handleRenamePath = async (event, { oldPath, newName }) => {
  const safeOld = resolveSafePath(oldPath);
  if (!safeOld) return OUTSIDE_ROOT;
  if (!isValidName(newName)) return { success: false, error: 'Invalid file name' };
  const safeNew = path.resolve(path.dirname(safeOld), newName);
  if (!isInsideProject(safeNew)) return OUTSIDE_ROOT;
  if (safeOld === safeNew) return { success: true, path: safeNew };
  try {
    const existing = await fs.stat(safeNew).catch(() => null);
    if (existing) return { success: false, error: 'Target already exists' };
    await fs.rename(safeOld, safeNew);
    return { success: true, path: safeNew };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const handleDeletePath = async (event, { targetPath }) => {
  const safe = resolveSafePath(targetPath);
  if (!safe) return OUTSIDE_ROOT;
  if (safe === path.resolve(projectRoot)) {
    return { success: false, error: 'Cannot delete the project root' };
  }
  try {
    await fs.rm(safe, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const ipcHandlers = {
  'choose-folder': handleChooseFolder,
  'set-project-root': (_event, rootPath) => setProjectRoot(rootPath),
  'get-project-root': () => ({ success: !!projectRoot, root: projectRoot }),
  'read-file': handleReadFile,
  'write-file': handleWriteFile,
  'read-dir': handleReadDir,
  'find-default-markdown': handleFindDefaultMarkdown,
  'show-item-in-folder': handleShowItemInFolder,
  'open-path': handleOpenPath,
  'open-external': handleOpenExternal,
  'create-file': handleCreateFile,
  'rename-path': handleRenamePath,
  'delete-path': handleDeletePath,
};

const registerIpcHandlers = () => {
  for (const [channel, handler] of Object.entries(ipcHandlers)) {
    ipcMain.handle(channel, handler);
  }
};

app.whenReady().then(() => {
  registerNexusAssetProtocol();
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (watcher) { watcher.close(); watcher = null; }
  if (process.platform !== 'darwin') app.quit();
});
