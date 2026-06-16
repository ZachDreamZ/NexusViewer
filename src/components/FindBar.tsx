import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CaseSensitive, X } from 'lucide-react';

interface FindBarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (newContent: string) => void;
  isOpen: boolean;
  isReplaceOpen: boolean;
  onClose: () => void;
}

interface Match {
  start: number;
  end: number;
}

export const FindBar: React.FC<FindBarProps> = ({
  textareaRef,
  content,
  onChange,
  isOpen,
  isReplaceOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo<Match[]>(() => {
    if (!query) return [];
    const haystack = caseSensitive ? content : content.toLowerCase();
    const needle = caseSensitive ? query : query.toLowerCase();
    const found: Match[] = [];
    let idx = 0;
    while ((idx = haystack.indexOf(needle, idx)) !== -1) {
      found.push({ start: idx, end: idx + needle.length });
      idx += needle.length || 1;
    }
    return found;
  }, [query, content, caseSensitive]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || matches.length === 0) return;
    const safeIdx = Math.min(matchIndex, matches.length - 1);
    const match = matches[safeIdx];
    const ta = textareaRef.current;
    if (!match || !ta) return;
    ta.focus();
    ta.setSelectionRange(match.start, match.end);
    const style = getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5 || 20;
    const line = content.slice(0, match.start).split('\n').length;
    ta.scrollTop = Math.max(0, (line - 3) * lineHeight);
  }, [matchIndex, isOpen, matches, content, textareaRef]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    setMatchIndex((matchIndex + 1) % matches.length);
  }, [matchIndex, matches.length]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    setMatchIndex((matchIndex - 1 + matches.length) % matches.length);
  }, [matchIndex, matches.length]);

  const replaceCurrent = useCallback(() => {
    if (matches.length === 0) return;
    const idx = Math.min(matchIndex, Math.max(0, matches.length - 1));
    const match = matches[idx];
    if (!match) return;
    const next = content.slice(0, match.start) + replacement + content.slice(match.end);
    onChange(next);
  }, [matches, matchIndex, replacement, content, onChange]);

  const replaceAll = useCallback(() => {
    if (!query) return;
    const haystack = caseSensitive ? content : content.toLowerCase();
    const needle = caseSensitive ? query : query.toLowerCase();
    const parts: string[] = [];
    let lastEnd = 0;
    let idx;
    while ((idx = haystack.indexOf(needle, lastEnd)) !== -1) {
      parts.push(content.slice(lastEnd, idx));
      parts.push(replacement);
      lastEnd = idx + needle.length;
    }
    parts.push(content.slice(lastEnd));
    onChange(parts.join(''));
  }, [query, caseSensitive, content, replacement, onChange]);

  if (!isOpen) return null;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMatchIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) goPrev();
              else goNext();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Find"
          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-charcoal border border-slate-200 dark:border-slate-700 rounded outline-none focus:border-slate-400 dark:focus:border-slate-500"
          aria-label="Find"
        />
        <span className="text-[10px] text-slate-400 font-mono w-16 text-center">
          {query ? (matches.length === 0 ? 'No results' : `${matchIndex + 1} / ${matches.length}`) : ''}
        </span>
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`p-1.5 rounded ${caseSensitive ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Case sensitive"
          aria-label="Toggle case sensitivity"
          aria-pressed={caseSensitive}
        >
          <CaseSensitive size={14} />
        </button>
        <button
          onClick={goPrev}
          disabled={matches.length === 0}
          className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={goNext}
          disabled={matches.length === 0}
          className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ArrowDown size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Close (Escape)"
          aria-label="Close find bar"
        >
          <X size={14} />
        </button>
      </div>
      {isReplaceOpen && (
        <div className="flex items-center gap-2 px-3 pb-2">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                replaceCurrent();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Replace with"
            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-charcoal border border-slate-200 dark:border-slate-700 rounded outline-none focus:border-slate-400 dark:focus:border-slate-500"
            aria-label="Replace with"
          />
          <button
            onClick={replaceCurrent}
            disabled={matches.length === 0}
            className="px-2 py-1 text-[11px] rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Replace
          </button>
          <button
            onClick={replaceAll}
            disabled={matches.length === 0}
            className="px-2 py-1 text-[11px] rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
