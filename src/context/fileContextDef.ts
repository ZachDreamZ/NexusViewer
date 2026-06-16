import { createContext } from 'react';

export interface FileState {
  filePath: string | null;
  content: string;
  isDirty: boolean;
}

export interface FileContextType {
  state: FileState;
  setContent: (content: string) => void;
  setFile: (path: string, content: string) => void;
  closeFile: () => void;
  markClean: () => void;
  saveFile: () => Promise<{ success: boolean; error?: string }>;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

export const FileContext = createContext<FileContextType | undefined>(undefined);
