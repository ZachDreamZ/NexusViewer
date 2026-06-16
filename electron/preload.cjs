const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  setProjectRoot: (rootPath) => ipcRenderer.invoke('set-project-root', rootPath),
  getProjectRoot: () => ipcRenderer.invoke('get-project-root'),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: ({ filePath, content }) => ipcRenderer.invoke('write-file', { filePath, content }),
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  findDefaultMarkdown: () => ipcRenderer.invoke('find-default-markdown'),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  createFile: ({ name, content }) => ipcRenderer.invoke('create-file', { name, content }),
  renamePath: ({ oldPath, newName }) => ipcRenderer.invoke('rename-path', { oldPath, newName }),
  deletePath: ({ targetPath }) => ipcRenderer.invoke('delete-path', { targetPath }),
  onWatcherEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('watcher:event', listener);
    return () => {
      ipcRenderer.removeListener('watcher:event', listener);
    };
  },
});
