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
    <section
      className="flex flex-col h-full flex-1 min-w-0 border-r border-border bg-background"
      aria-label="Source editor"
    >
      <div className="flex items-center justify-between h-9 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-muted-foreground" />
          <span className="text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider">
            Source
          </span>
        </div>
        <div className="text-caption-2 text-muted-foreground font-mono tabular-nums">
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
        className="editor-soft flex-1 px-8 py-6 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none focus:outline-none leading-relaxed"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Begin your transmission..."
        spellCheck={false}
      />
    </section>
  );
};
