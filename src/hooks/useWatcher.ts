import { useEffect, useRef } from 'react';
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
    const unsubscribe = window.electron.onWatcherEvent((event) => {
      const { onFileChange, onFileDelete, onTreeChange } = handlersRef.current;
      const { selectedFile: currentFile, isDirty: currentDirty } = stateRef.current;
      if (event.type === 'change' && event.path === currentFile) {
        if (!currentDirty) {
          onFileChange(event.path);
        } else {
          toast.show('File changed externally', 'warning', {
            label: 'Reload',
            onClick: () => handlersRef.current.onFileChange(event.path),
          });
        }
      }
      if (event.type === 'unlink' && event.path === currentFile) {
        onFileDelete(event.path);
        toast.show('File was deleted externally', 'info');
      }
      if (event.type === 'add' || event.type === 'unlink' || event.type === 'addDir' || event.type === 'unlinkDir') {
        onTreeChange();
      }
    });
    return unsubscribe;
  }, [projectRoot, toast]);
};
