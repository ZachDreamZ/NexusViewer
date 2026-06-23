import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { GithubIcon, Keyboard, BookOpen } from './Icons';
import { Logo } from './Logo';
import { cn } from '../lib/utils';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ['⌘ / Ctrl + N', 'New file'],
  ['⌘ / Ctrl + O', 'Open folder'],
  ['⌘ / Ctrl + S', 'Save'],
  ['⌘ / Ctrl + F', 'Find'],
  ['⌘ / Ctrl + H', 'Find & replace'],
  ['⌘ / Ctrl + B', 'Bold selection'],
  ['⌘ / Ctrl + I', 'Italic selection'],
  ['⌘ / Ctrl + K', 'Insert link'],
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
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-foreground/20 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between h-12 px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <div>
              <h2 id="about-modal-title" className="text-callout font-semibold tracking-tight leading-none">
                NexusViewer
              </h2>
              <p className="text-caption-2 text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                Markdown Viewer
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-out"
            aria-label="Close about"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-body leading-relaxed text-muted-foreground">
            A minimal, developer-focused Markdown viewer and editor. Fuses Claude's visual
            minimalism with Open Code's developer-centric power. No telemetry, no cloud, no
            accounts.
          </p>

          <section>
            <h3 className="flex items-center gap-1.5 text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Keyboard size={12} /> Keyboard
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              {SHORTCUTS.map(([key, desc], i) => (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between px-3 py-1.5 text-caption-1',
                    i < SHORTCUTS.length - 1 && 'border-b border-border'
                  )}
                >
                  <span className="text-foreground/80">{desc}</span>
                  <kbd className="px-1.5 py-0.5 text-caption-2 font-mono rounded border border-border bg-muted text-foreground/80">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <BookOpen size={12} /> Resources
            </h3>
            <a
              href="https://github.com/ZachDreamZ"
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => {
                e.preventDefault();
                window.electron.openExternal('https://github.com/ZachDreamZ');
              }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-accent transition-colors duration-200 ease-out group"
            >
              <span className="flex items-center gap-2 text-body font-medium">
                <GithubIcon size={16} className="text-foreground" />
                Author on GitHub
              </span>
              <ExternalLink size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          </section>
        </div>

        <div className="h-9 px-4 border-t border-border text-caption-2 text-muted-foreground font-mono flex items-center justify-between">
          <span>MIT License</span>
          <span className="tabular-nums">v{__APP_VERSION__}</span>
        </div>
      </div>
    </div>
  );
};
