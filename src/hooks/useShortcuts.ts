import { useEffect } from 'react';

export interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  inEditorOnly?: boolean;
  description: string;
  handler: (e: KeyboardEvent) => void;
}

interface UseShortcutsOptions {
  shortcuts: Shortcut[];
  isEditorFocused: () => boolean;
}

const normalizeKey = (k: string) => k.length === 1 ? k.toLowerCase() : k.toLowerCase();

export const useShortcuts = ({ shortcuts, isEditorFocused }: UseShortcutsOptions): void => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const wantMeta = e.ctrlKey || e.metaKey;
      for (const s of shortcuts) {
        if (s.meta !== wantMeta) continue;
        if (!!s.shift !== e.shiftKey) continue;
        if (normalizeKey(e.key) !== normalizeKey(s.key)) continue;
        if (s.inEditorOnly && !isEditorFocused()) continue;
        e.preventDefault();
        s.handler(e);
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcuts, isEditorFocused]);
};
