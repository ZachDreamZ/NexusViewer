export type WatcherEventType = 'change' | 'add' | 'unlink' | 'addDir' | 'unlinkDir';

export interface WatcherEvent {
  type: WatcherEventType;
  path: string;
}

interface ElectronAPI {
  chooseFolder: () => Promise<{ success: boolean; root?: string; error?: string }>;
  setProjectRoot: (rootPath: string) => Promise<{ success: boolean; root?: string; error?: string }>;
  getProjectRoot: () => Promise<{ success: boolean; root?: string | null }>;
  readFile: (path: string) => Promise<{ success: boolean; content?: string; path?: string; error?: string }>;
  writeFile: ({ filePath, content }: { filePath: string; content: string; }) => Promise<{ success: boolean; path?: string; error?: string }>;
  readDir: (path: string) => Promise<{ success: boolean; files?: Array<{ name: string; path: string; isDirectory: boolean }>; error?: string }>;
  findDefaultMarkdown: () => Promise<{ success: boolean; path?: string; error?: string }>;
  showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
  openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  createFile: ({ name, content }: { name: string; content?: string; }) => Promise<{ success: boolean; path?: string; error?: string }>;
  renamePath: ({ oldPath, newName }: { oldPath: string; newName: string; }) => Promise<{ success: boolean; path?: string; error?: string }>;
  deletePath: ({ targetPath }: { targetPath: string; }) => Promise<{ success: boolean; error?: string }>;
  onWatcherEvent: (callback: (event: WatcherEvent) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
