import { useEffect, useRef } from 'react';
import { X, ExternalLink, BookOpen, Keyboard } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import logo from '../assets/logo.svg';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl + O', 'Open folder'],
  ['Ctrl + N', 'New file'],
  ['Ctrl + S', 'Save'],
  ['Ctrl + F', 'Find'],
  ['Ctrl + H', 'Find & replace'],
  ['Ctrl + B', 'Bold selection'],
  ['Ctrl + I', 'Italic selection'],
  ['Ctrl + K', 'Insert link'],
];

export const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-charcoal shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 drop-shadow-[0_0_6px_rgba(0,242,255,0.35)]"
            />
            <div>
              <h2 id="about-modal-title" className="text-sm font-bold tracking-tighter text-slate-900 dark:text-slate-100">
                NEXUSVIEWER
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Next-Gen Markdown Viewer
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close about"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm text-slate-700 dark:text-slate-300">
          <p className="leading-relaxed">
            A minimal, developer-focused Markdown viewer and editor. Fuses Claude's visual
            minimalism with Open Code's developer-centric power. No telemetry, no cloud, no
            accounts.
          </p>

          <section>
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              <Keyboard size={12} /> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{desc}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-charcoal/60 text-slate-700 dark:text-slate-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              <BookOpen size={12} /> Resources
            </h3>
            <div className="space-y-1.5 text-xs">
              <a
                href="https://github.com/ZachDreamZ"
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.openExternal('https://github.com/ZachDreamZ');
                }}
                className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <GithubIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">Author on GitHub</span>
                </span>
                <ExternalLink size={12} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </a>
            </div>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>MIT License</span>
          <span>v0.1.5</span>
        </div>
      </div>
    </div>
  );
};
