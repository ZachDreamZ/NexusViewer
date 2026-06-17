import { useState, useCallback, useRef } from 'react';
import { useFile } from '../context/useFile';
import { useToast } from '../context/useToast';
import { buildTree, type FileNode } from '../lib/tree';

interface ProjectState {
  projectRoot: string | null;
  nodes: FileNode[];
  selectedFile: string | null;
  treeLoadId: number;
}

export interface UseProjectReturn extends ProjectState {
  setProjectRoot: (root: string) => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  closeFile: () => void;
  chooseFolder: () => Promise<void>;
  newFile: () => Promise<void>;
  refreshTree: () => Promise<void>;
}

export const useProject = (): UseProjectReturn => {
  const { setFile, closeFile: ctxCloseFile } = useFile();
  const toast = useToast();
  const [projectRoot, setProjectRootState] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [treeLoadId, setTreeLoadId] = useState(0);
  const lastLoadedRootRef = useRef<string | null>(null);

  const openFile = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const result = await window.electron.readFile(filePath);
      if (result.success && result.content !== undefined) {
        setFile(filePath, result.content);
      } else {
        toast.show(`Failed to read file: ${result.error ?? 'unknown error'}`, 'error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.show(`Read error: ${message}`, 'error');
    }
  }, [setFile, toast]);

  const loadProject = useCallback(async (root: string) => {
    setProjectRootState(root);
    setSelectedFile(null);
    ctxCloseFile();
    lastLoadedRootRef.current = root;

    const result = await window.electron.readDir(root);
    if (!result.success || !result.files) {
      toast.show('Failed to load project folder', 'error');
      console.error('Error loading project structure:', result.error);
      return;
    }

    setNodes(buildTree(result.files));
    setTreeLoadId(id => id + 1);

    const defaultResult = await window.electron.findDefaultMarkdown();
    if (defaultResult.success && defaultResult.path) {
      await openFile(defaultResult.path);
    }
  }, [toast, openFile, ctxCloseFile]);

  const chooseFolder = useCallback(async () => {
    const result = await window.electron.chooseFolder();
    if (result.success && result.root) {
      await loadProject(result.root);
      toast.show('Folder opened', 'success');
    }
  }, [loadProject, toast]);

  const newFile = useCallback(async () => {
    if (!projectRoot) {
      toast.show('Open a folder first', 'info');
      return;
    }
    const fileResult = await window.electron.createFile({ name: 'untitled.md' });
    if (fileResult.success && fileResult.path) {
      await openFile(fileResult.path);
      return;
    }
    if (fileResult.error !== 'File already exists') {
      toast.show(`Failed to create file: ${fileResult.error ?? 'unknown error'}`, 'error');
      return;
    }
    for (let i = 1; i < 1000; i++) {
      const retry = await window.electron.createFile({ name: `untitled-${i}.md` });
      if (retry.success && retry.path) {
        await openFile(retry.path);
        return;
      }
      if (retry.error !== 'File already exists') {
        toast.show(`Failed to create file: ${retry.error ?? 'unknown error'}`, 'error');
        return;
      }
    }
    toast.show('Could not find an unused untitled name', 'error');
  }, [projectRoot, openFile, toast]);

  const refreshTree = useCallback(async () => {
    if (!lastLoadedRootRef.current) return;
    try {
      const result = await window.electron.readDir(lastLoadedRootRef.current);
      if (result.success && result.files) {
        setNodes(buildTree(result.files));
        setTreeLoadId(id => id + 1);
      }
    } catch (err) {
      console.error('Tree refresh error:', err);
    }
  }, []);

  return {
    projectRoot,
    nodes,
    selectedFile,
    treeLoadId,
    setProjectRoot: loadProject,
    openFile,
    closeFile: () => {
      ctxCloseFile();
      setSelectedFile(null);
    },
    chooseFolder,
    newFile,
    refreshTree,
  };
};
