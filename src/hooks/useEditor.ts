import { useCallback } from 'react';

export interface EditorApi {
  wrapSelection: (before: string, after: string) => void;
  insertAtCursor: (text: string, cursorOffset?: number) => void;
  getElement: () => HTMLTextAreaElement | null;
}

export const useEditor = (ref: React.RefObject<HTMLTextAreaElement | null>, onChange: (next: string) => void): EditorApi => {
  const wrapSelection = useCallback((before: string, after: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const next = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      if (selected.length === 0) {
        ta.setSelectionRange(start + before.length, start + before.length);
      } else {
        ta.setSelectionRange(start + before.length, end + before.length + after.length);
      }
    });
  }, [ref, onChange]);

  const insertAtCursor = useCallback((text: string, cursorOffset = 0) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length + cursorOffset;
      ta.setSelectionRange(pos, pos);
    });
  }, [ref, onChange]);

  const getElement = useCallback(() => ref.current, [ref]);

  return { wrapSelection, insertAtCursor, getElement };
};
