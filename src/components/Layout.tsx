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

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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
    <div className="flex flex-col h-screen">
      {/* Title Bar — Apple-style frosted glass */}
      <header
        className="frosted flex items-center justify-between h-12 px-4 border-b border-sidebar-border shrink-0 z-10"
        role="banner"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={logo}
            alt=""
            width={22}
            height={22}
            className="w-[22px] h-[22px] shrink-0"
            style={{ filter: 'drop-shadow(0 0 6px var(--color-neon-cyan-glow))' }}
          />
          <h1 className="text-callout font-semibold tracking-tight shrink-0 text-foreground">
            NexusViewer
          </h1>
          {projectRoot && (
            <>
              <span className="text-muted-foreground/50 text-caption-1 shrink-0">·</span>
              <span className="text-caption-1 text-muted-foreground font-mono truncate min-w-0">
                {projectRoot}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {state.isDirty && (
            <div className="flex items-center gap-1.5 px-2 text-caption-1 text-primary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Unsaved</span>
            </div>
          )}

          <button
            onClick={handleNewFile}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-body font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out"
            title="New file (Ctrl+N)"
          >
            <FilePlus size={14} />
            <span>New</span>
          </button>
          <button
            onClick={handleChooseFolder}
            className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md text-body font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 ease-out shadow-sm"
            title="Open folder (Ctrl+O)"
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={cn(
              "inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors duration-200 ease-out",
              autoSaveEnabled
                ? "bg-neon-cyan-soft text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={autoSaveEnabled ? 'Auto-save on' : 'Auto-save off'}
            aria-pressed={autoSaveEnabled}
          >
            <Zap size={14} className={autoSaveEnabled ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleSave}
            disabled={!state.filePath}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out disabled:opacity-30 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setAboutOpen(true)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out"
            aria-label="Open about and shortcuts"
            title="About & shortcuts"
          >
            <HelpCircle size={14} />
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
  );
};
