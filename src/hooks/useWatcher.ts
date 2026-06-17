import { useEffect, useRef } from 'react';
import { useFile } from '../context/useFile';
import { useToast } from '../context/useToast';

export interface UseWatcherOptions {
  projectRoot: string | null;
  selectedFile: string | null;
  isDirty: boolean;
  onFileChange: (path: string) => void;
  onFileDelete: (path: string) => void;
  onTreeChange: () => void;
}

export const useWatcher = ({
  projectRoot,
  selectedFile,
  isDirty,
  onFileChange,
  onFileDelete,
  onTreeChange,
}: UseWatcherOptions): void => {
  const toast = useToast();
  const { setFile } = useFile();

  const handlersRef = useRef({ onFileChange, onFileDelete, onTreeChange });
  const stateRef = useRef({ selectedFile, isDirty });

  useEffect(() => {
    handlersRef.current = { onFileChange, onFileDelete, onTreeChange };
  }, [onFileChange, onFileDelete, onTreeChange]);

  useEffect(() => {
    stateRef.current = { selectedFile, isDirty };
  }, [selectedFile, isDirty]);

  useEffect(() => {
    if (!projectRoot) return;
    const handlers = handlersRef.current;
    const state = stateRef.current;
    const unsubscribe = window.electron.onWatcherEvent((event) => {
      if (event.type === 'change' && event.path === state.selectedFile) {
        if (!state.isDirty) {
          handlers.onFileChange(event.path);
        } else {
          toast.show('File changed externally', 'warning', {
            label: 'Reload',
            onClick: () => handlers.onFileChange(event.path),
          });
        }
      }
      if (event.type === 'unlink' && event.path === state.selectedFile) {
        handlers.onFileDelete(event.path);
        toast.show('File was deleted externally', 'info');
      }
      if (event.type === 'add' || event.type === 'unlink' || event.type === 'addDir' || event.type === 'unlinkDir') {
        handlers.onTreeChange();
      }
    });
    return unsubscribe;
  }, [projectRoot, toast, setFile]);
};
