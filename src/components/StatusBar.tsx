import { GithubIcon } from './Icons';
import { useFile } from '../context/useFile';
import { cn } from '../lib/utils';

export const StatusBar: React.FC = () => {
  const { state } = useFile();

  const wordCount = state.content.trim() === ''
    ? 0
    : state.content.trim().split(/\s+/).length;

  const lineCount = state.content.split('\n').length;

  return (
    <footer
      className="flex items-center justify-between h-6 px-3 border-t border-border bg-card/40 text-caption-2 text-muted-foreground font-medium transition-colors duration-200 ease-out"
      role="contentinfo"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors duration-200 ease-out',
            state.isDirty ? 'bg-warning' : 'bg-success'
          )} />
          <span>{state.isDirty ? 'Unsaved' : 'Saved'}</span>
        </div>
        <div className="flex items-center gap-1.5 tabular-nums">
          <span>{lineCount} lines</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{wordCount} words</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="truncate max-w-xs font-mono opacity-70">
          {state.filePath || 'No file selected'}
        </span>
        <span className="uppercase tracking-wider font-semibold text-muted-foreground/70">UTF-8</span>
        <span className="w-px h-3 bg-border" />
        <button
          onClick={() => window.electron.openExternal('https://github.com/ZachDreamZ')}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out"
          title="View author on GitHub"
          aria-label="View author on GitHub"
        >
          <GithubIcon size={12} className="text-muted-foreground" />
          <span>ZachDreamZ</span>
        </button>
      </div>
    </footer>
  );
};
