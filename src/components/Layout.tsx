import { useRef, useState, useCallback, useMemo } from 'react';
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
import { useProject } from '../hooks/useProject';
import { useShortcuts } from '../hooks/useShortcuts';
import { useWatcher } from '../hooks/useWatcher';
import { useEditor } from '../hooks/useEditor';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

interface LayoutProps {
  darkMode: boolean;
  setDarkMode: (next: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ darkMode, setDarkMode }) => {
  const { state, setContent, saveFile, autoSaveEnabled, setAutoSaveEnabled } = useFile();
  const toast = useToast();
  const project = useProject();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const editorApi = useEditor(editorRef, setContent);

  const isEditorFocused = useCallback(
    () => editorRef.current !== null && document.activeElement === editorRef.current,
    []
  );

  const handleEditorScroll = useCallback(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    const editorRange = editor.scrollHeight - editor.clientHeight;
    const previewRange = preview.scrollHeight - preview.clientHeight;
    if (editorRange <= 0 || previewRange <= 0) return;
    const scrollPercentage = editor.scrollTop / editorRange;
    preview.scrollTop = scrollPercentage * previewRange;
  }, []);

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

  const { setFile } = useFile();
  const reloadFile = useCallback(async (path: string) => {
    const result = await window.electron.readFile(path);
    if (result.success && result.content !== undefined) {
      setFile(path, result.content);
    }
  }, [setFile]);

  useShortcuts({
    isEditorFocused,
    shortcuts: useMemo(() => ([
      { key: 'n', meta: true, description: 'New file', handler: () => void project.newFile() },
      { key: 's', meta: true, description: 'Save', handler: () => void handleSave() },
      { key: 'o', meta: true, description: 'Open folder', handler: () => void project.chooseFolder() },
      { key: 'b', meta: true, inEditorOnly: true, description: 'Bold', handler: () => editorApi.wrapSelection('**', '**') },
      { key: 'i', meta: true, inEditorOnly: true, description: 'Italic', handler: () => editorApi.wrapSelection('*', '*') },
      { key: 'k', meta: true, inEditorOnly: true, description: 'Link', handler: () => editorApi.insertAtCursor('[text](https://)', -13) },
    ]), [project, handleSave, editorApi]),
  });

  useWatcher({
    projectRoot: project.projectRoot,
    selectedFile: state.filePath,
    isDirty: state.isDirty,
    onFileChange: reloadFile,
    onFileDelete: () => project.closeFile(),
    onTreeChange: () => void project.refreshTree(),
  });

  return (
    <div className="flex flex-col h-screen">
      <TitleBar
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
        projectRoot={project.projectRoot}
        isDirty={state.isDirty}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={() => setAutoSaveEnabled(!autoSaveEnabled)}
        onNewFile={project.newFile}
        onChooseFolder={project.chooseFolder}
        onSave={handleSave}
        canSave={!!state.filePath}
        onOpenAbout={() => setAboutOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <FileTree
          key={project.treeLoadId}
          initialNodes={project.nodes}
          selectedFile={project.selectedFile}
          onFileSelect={project.openFile}
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
              <div className="flex-1 h-full overflow-hidden">
                <Preview content={state.content} currentFile={state.filePath} scrollRef={previewRef} />
              </div>
            </main>
          </div>
        ) : (
          <Welcome onChooseFolder={project.chooseFolder} />
        )}
      </div>

      <StatusBar />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
};

interface TitleBarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  projectRoot: string | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onNewFile: () => void;
  onChooseFolder: () => void;
  onSave: () => void;
  canSave: boolean;
  onOpenAbout: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  darkMode,
  onToggleDark,
  projectRoot,
  isDirty,
  autoSaveEnabled,
  onToggleAutoSave,
  onNewFile,
  onChooseFolder,
  onSave,
  canSave,
  onOpenAbout,
}) => (
  <header
    className="frosted flex items-center justify-between h-12 px-4 border-b border-sidebar-border shrink-0 z-10"
    role="banner"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <Logo size={22} />
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
      {isDirty && (
        <div className="flex items-center gap-1.5 px-2 text-caption-1 text-primary">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Unsaved</span>
        </div>
      )}

      <HeaderButton onClick={onNewFile} title="New file (Ctrl+N)">
        <FilePlus size={14} />
        <span>New</span>
      </HeaderButton>
      <HeaderButton onClick={onChooseFolder} title="Open folder (Ctrl+O)" variant="primary">
        <FolderOpen size={14} />
        <span>Open</span>
      </HeaderButton>

      <div className="w-px h-5 bg-border mx-1" />

      <HeaderButton
        onClick={onToggleAutoSave}
        title={autoSaveEnabled ? 'Auto-save on' : 'Auto-save off'}
        aria-pressed={autoSaveEnabled}
        active={autoSaveEnabled}
        iconOnly
      >
        <Zap size={14} className={autoSaveEnabled ? 'fill-current' : ''} />
      </HeaderButton>
      <HeaderButton onClick={onSave} title="Save (Ctrl+S)" disabled={!canSave} iconOnly>
        <Save size={14} />
      </HeaderButton>
      <HeaderButton
        onClick={onToggleDark}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        iconOnly
      >
        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
      </HeaderButton>
      <HeaderButton
        onClick={onOpenAbout}
        title="About & shortcuts"
        aria-label="Open about and shortcuts"
        iconOnly
      >
        <HelpCircle size={14} />
      </HeaderButton>
    </div>
  </header>
);

interface HeaderButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  active?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  onClick,
  title,
  children,
  variant = 'default',
  active = false,
  disabled = false,
  iconOnly = false,
  ...ariaProps
}) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      {...ariaProps}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md transition-colors duration-200 ease-out',
        iconOnly ? 'h-8 w-8' : 'h-8 px-2.5 text-body font-medium',
        isPrimary && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        !isPrimary && active && 'bg-neon-cyan-soft text-primary',
        !isPrimary && !active && !disabled && 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
};
