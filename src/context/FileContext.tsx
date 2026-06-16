import React, { useState, useCallback, useEffect } from 'react';
import { FileContext, type FileContextType, type FileState } from './fileContextDef';

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FileState>({
    filePath: null,
    content: '',
    isDirty: false,
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const setContent = useCallback((content: string) => {
    setState(prev => {
      if (prev.content === content) return prev;
      return { ...prev, content, isDirty: true };
    });
  }, []);

  const setFile = useCallback((path: string, content: string) => {
    setState({
      filePath: path,
      content,
      isDirty: false,
    });
  }, []);

  const closeFile = useCallback(() => {
    setState({ filePath: null, content: '', isDirty: false });
  }, []);

  const markClean = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: false }));
  }, []);

  const saveFile = useCallback(async () => {
    if (!state.filePath) return { success: false, error: 'No file selected' };

    try {
      const result = await window.electron.writeFile({
        filePath: state.filePath,
        content: state.content,
      });

      if (result.success) {
        markClean();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }, [state.filePath, state.content, markClean]);

  useEffect(() => {
    if (!autoSaveEnabled || !state.isDirty || !state.filePath) return;

    const timer = setTimeout(() => {
      saveFile();
    }, 2000);

    return () => clearTimeout(timer);
  }, [autoSaveEnabled, state.isDirty, state.filePath, saveFile]);

  const value: FileContextType = {
    state,
    setContent,
    setFile,
    closeFile,
    markClean,
    saveFile,
    autoSaveEnabled,
    setAutoSaveEnabled,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
