import { useRef, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { FindBar } from './FindBar';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onScroll?: () => void;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const Editor: React.FC<EditorProps> = ({ content = '', onChange, onScroll, ref }) => {
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const localRef = useRef<HTMLTextAreaElement>(null);

  const setTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    localRef.current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    }
  }, [ref]);

  const openFind = useCallback((withReplace: boolean) => {
    setIsFindOpen(true);
    if (withReplace) setIsReplaceOpen(true);
  }, []);

  const closeFind = useCallback(() => {
    setIsFindOpen(false);
    setIsReplaceOpen(false);
    localRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) {
      if (e.key === 'Escape' && isFindOpen) {
        e.preventDefault();
        closeFind();
      }
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'f') {
      e.preventDefault();
      openFind(false);
    } else if (key === 'h') {
      e.preventDefault();
      openFind(true);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-200 dark:border-slate-800 w-1/2 bg-white dark:bg-obsidian-lighter">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Source</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          {(content || '').split('\n').length} lines
        </div>
      </div>
      <FindBar
        textareaRef={localRef}
        content={content}
        onChange={onChange}
        isOpen={isFindOpen}
        isReplaceOpen={isReplaceOpen}
        onClose={closeFind}
      />
      <textarea
        ref={setTextareaRef}
        onScroll={onScroll}
        onKeyDown={handleKeyDown}
        className="flex-1 p-8 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-sm resize-none outline-none focus:ring-0 leading-relaxed"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Begin your transmission..."
        spellCheck={false}
      />
    </div>
  );
};
