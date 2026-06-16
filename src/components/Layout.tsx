import { useRef, useEffect, useState, useCallback } from 'react';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Frontmatter } from './Frontmatter';
import { FileTree } from './FileTree';
import { StatusBar } from './StatusBar';
import { Welcome } from './Welcome';
import { AboutModal } from './AboutModal';
import { Moon, Sun, Save, Zap, FolderOpen, FilePlus, HelpCircle } from 'lucide-react';
import { useFile } from '../context/useFile';
import { useToast } from '../context/useToast';
import logo from '../assets/logo.svg';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface LayoutProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const buildTree = (entries: Array<{ name: string; path: string; isDirectory: boolean }>): FileNode[] =>
  [...entries]
    .map(entry => ({
      name: entry.name,
      path: entry.path,
      isDirectory: entry.isDirectory,
      children: undefined,
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

export const Layout: React.FC<LayoutProps> = ({ darkMode, setDarkMode }) => {
  const { state, setContent, setFile, saveFile, closeFile, autoSaveEnabled, setAutoSaveEnabled } = useFile();
  const toast = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [projectRoot, setProjectRootState] = useState<string | null>(null);
  const [treeLoadId, setTreeLoadId] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const openFile = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const result = await window.electron.readFile(filePath);
      if (result.success && result.content !== undefined) {
        setFile(filePath, result.content);
      } else {
        toast.show(`Failed to read file: ${result.error ?? 'unknown error'}`, 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(`Read error: ${message}`, 'error');
    }
  }, [setFile, toast]);

  const loadProject = useCallback(async (root: string) => {
    setProjectRootState(root);
    setSelectedFile(null);

    const result = await window.electron.readDir(root);
    if (!result.success || !result.files) {
      toast.show('Failed to load project folder', 'error');
      console.error('Error loading project structure:', result.error);
      return;
    }

    const tree = buildTree(result.files);
    setNodes(tree);
    setTreeLoadId(id => id + 1);

    const defaultResult = await window.electron.findDefaultMarkdown();
    if (defaultResult.success && defaultResult.path) {
      await openFile(defaultResult.path);
    }
  }, [toast, openFile]);

  const handleChooseFolder = useCallback(async () => {
    const result = await window.electron.chooseFolder();
    if (result.success && result.root) {
      await loadProject(result.root);
      toast.show('Folder opened', 'success');
    }
  }, [loadProject, toast]);

  const handleSave = useCallback(async () => {
    if (!state.filePath) {
      toast.show('No file open to save', 'info');
      return;
    }
    const result = await saveFile();
    if (result.success) {
      toast.show('Saved', 'success');
    } else {
      toast.show(`Save failed: ${result.error ?? 'unknown error'}`, 'error');
    }
  }, [state.filePath, saveFile, toast]);

  const handleNewFile = useCallback(async () => {
    if (!projectRoot) {
      toast.show('Open a folder first', 'info');
      return;
    }
    const fileResult = await window.electron.createFile({ name: 'untitled.md' });
    if (!fileResult.success) {
      if (fileResult.error === 'File already exists') {
        for (let i = 1; i < 1000; i++) {
          const retry = await window.electron.createFile({ name: `untitled-${i}.md` });
          if (retry.success && retry.path) {
            await openFile(retry.path);
            return;
          }
          if (retry.error !== 'File already exists') {
            toast.show(`Failed to create file: ${retry.error ?? 'unknown error'}`, 'error');
            return;
          }
        }
        toast.show('Could not find an unused untitled name', 'error');
      } else {
        toast.show(`Failed to create file: ${fileResult.error ?? 'unknown error'}`, 'error');
      }
      return;
    }
    if (fileResult.path) {
      await openFile(fileResult.path);
    }
  }, [projectRoot, openFile, toast]);

  const handleEditorScroll = () => {
    if (editorRef.current && previewRef.current) {
      const editor = editorRef.current;
      const preview = previewRef.current;
      const editorRange = editor.scrollHeight - editor.clientHeight;
      const previewRange = preview.scrollHeight - preview.clientHeight;

      if (editorRange <= 0 || previewRange <= 0) return;

      const scrollPercentage = editor.scrollTop / editorRange;
      preview.scrollTop = scrollPercentage * previewRange;
    }
  };

  const wrapSelection = useCallback((before: string, after: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const next = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      if (selected.length === 0) {
        ta.setSelectionRange(start + before.length, start + before.length);
      } else {
        ta.setSelectionRange(start + before.length, end + before.length + after.length);
      }
    });
  }, [setContent]);

  const insertAtCursor = useCallback((text: string, cursorOffset = 0) => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length + cursorOffset;
      ta.setSelectionRange(pos, pos);
    });
  }, [setContent]);

  const refreshTree = useCallback(() => {
    if (!projectRoot) return;
    window.electron.readDir(projectRoot).then(result => {
      if (result.success && result.files) {
        setNodes(buildTree(result.files));
        setTreeLoadId(id => id + 1);
      }
    }).catch(err => console.error('Tree refresh error:', err));
  }, [projectRoot]);

  const handleCloseFile = useCallback(() => {
    closeFile();
    setSelectedFile(null);
  }, [closeFile]);

  useEffect(() => {
    if (!projectRoot) return;
    const unsubscribe = window.electron.onWatcherEvent((event) => {
      if (event.type === 'change' && event.path === state.filePath) {
        if (!state.isDirty) {
          window.electron.readFile(event.path).then(result => {
            if (result.success && result.content !== undefined) {
              setFile(event.path, result.content);
            }
          });
        } else {
          toast.show('File changed externally', 'warning', {
            label: 'Reload',
            onClick: () => {
              window.electron.readFile(event.path).then(result => {
                if (result.success && result.content !== undefined) {
                  setFile(event.path, result.content);
                }
              });
            },
          });
        }
      }
      if (event.type === 'unlink' && event.path === state.filePath) {
        handleCloseFile();
        toast.show('File was deleted externally', 'info');
      }
      if (event.type === 'add' || event.type === 'unlink' || event.type === 'addDir' || event.type === 'unlinkDir') {
        refreshTree();
      }
    });
    return unsubscribe;
  }, [projectRoot, state.filePath, state.isDirty, setFile, handleCloseFile, toast, refreshTree]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const inEditor = editorRef.current && document.activeElement === editorRef.current;

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          handleNewFile();
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'o':
          e.preventDefault();
          handleChooseFolder();
          break;
        case 'b':
          if (inEditor) {
            e.preventDefault();
            wrapSelection('**', '**');
          }
          break;
        case 'i':
          if (inEditor) {
            e.preventDefault();
            wrapSelection('*', '*');
          }
          break;
        case 'k':
          if (inEditor) {
            e.preventDefault();
            insertAtCursor('[text](https://)', -13);
          }
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleChooseFolder, handleNewFile, wrapSelection, insertAtCursor]);

  return (
    <div className="flex flex-col h-screen transition-colors duration-300">
      <div className="flex flex-col h-full bg-white dark:bg-charcoal text-slate-900 dark:text-slate-300">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-charcoal z-10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt=""
              width={24}
              height={24}
              className="w-6 h-6 shrink-0 drop-shadow-[0_0_4px_rgba(0,242,255,0.35)]"
            />
            <h1 className="text-sm font-bold tracking-tighter shrink-0">NEXUSVIEWER</h1>
            {projectRoot && (
              <span className="text-[10px] text-slate-400 font-mono truncate min-w-0">
                {projectRoot}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleNewFile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
              title="New file (Ctrl+N)"
            >
              <FilePlus size={14} /> New
            </button>
            <button
              onClick={handleChooseFolder}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium"
              title="Open folder (Ctrl+O)"
            >
              <FolderOpen size={14} /> Open Folder
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-xs font-medium ${
                autoSaveEnabled
                  ? 'bg-neon-teal/10 text-neon-teal'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
              aria-pressed={autoSaveEnabled}
            >
              <Zap size={14} className={autoSaveEnabled ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleSave}
              disabled={!state.filePath}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              title="Save (Ctrl+S)"
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setAboutOpen(true)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open about and shortcuts"
              title="About & shortcuts"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <FileTree
            key={treeLoadId}
            initialNodes={nodes}
            selectedFile={selectedFile}
            onFileSelect={openFile}
          />

          {state.filePath ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <Frontmatter content={state.content} />

              <main className="flex flex-1 overflow-hidden">
                <Editor
                  ref={editorRef}
                  content={state.content}
                  onChange={setContent}
                  onScroll={handleEditorScroll}
                />
                <div
                  ref={previewRef}
                  className="flex-1 h-full overflow-hidden"
                >
                  <Preview content={state.content} currentFile={state.filePath} />
                </div>
              </main>
            </div>
          ) : (
            <Welcome />
          )}
        </div>

        <StatusBar />
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      </div>
    </div>
  );
};
