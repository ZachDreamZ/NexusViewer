import { GithubIcon } from './GithubIcon';
import { useFile } from '../context/useFile';

export const StatusBar: React.FC = () => {
  const { state } = useFile();

  const wordCount = state.content.trim() === ''
    ? 0
    : state.content.trim().split(/\s+/).length;

  const lineCount = state.content.split('\n').length;

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-charcoal text-[10px] text-slate-500 dark:text-slate-400 font-medium">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${state.isDirty ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{state.isDirty ? 'Unsaved' : 'Saved'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{lineCount} Lines</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{wordCount} Words</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="truncate max-w-xs opacity-70">
          {state.filePath || 'No file selected'}
        </span>
        <span className="uppercase tracking-tighter font-bold text-slate-400">UTF-8</span>
        <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
        <button
          onClick={() => window.electron.openExternal('https://github.com/ZachDreamZ')}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="View author on GitHub"
          aria-label="View author on GitHub"
        >
          <GithubIcon className="w-3 h-3" />
          <span>ZachDreamZ</span>
        </button>
      </div>
    </div>
  );
};

StatusBar.displayName = 'StatusBar';
