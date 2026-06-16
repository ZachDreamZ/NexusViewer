import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  initialNodes: FileNode[];
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  name: string;
  isDirectory: boolean;
}

const FileTreeNode: React.FC<{
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  depth: number;
  onLoadChildren: (node: FileNode) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}> = ({ node, onFileSelect, selectedFile, depth, onLoadChildren, onContextMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const loadStartedRef = useRef(false);

  const isSelected = selectedFile === node.path;

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.isDirectory) return;

    if (!isOpen && !node.children && !loadStartedRef.current) {
      loadStartedRef.current = true;
      setIsLoading(true);
      onLoadChildren(node)
        .catch(() => { /* logged in caller */ })
        .finally(() => setIsLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handleFileClick = () => {
    if (!node.isDirectory) {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={node.isDirectory ? handleExpand : handleFileClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        disabled={isLoading}
        className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors disabled:opacity-50 ${
          isSelected
            ? 'bg-paper-soft dark:bg-slate-800 text-stone-900 dark:text-neon-teal font-medium'
            : 'text-stone-600 dark:text-stone-500 hover:bg-paper-soft dark:hover:bg-slate-900/50'
        }`}
        style={{ paddingLeft: `${(depth * 12) + 16}px` }}
      >
        {node.isDirectory && (
          isLoading ? (
            <div className="w-3.5 h-3.5" />
          ) : isOpen ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )
        )}
        {node.isDirectory ? (
          <Folder size={14} className={isSelected ? 'text-stone-900 dark:text-neon-teal' : 'text-stone-400'} />
        ) : (
          <FileText size={14} className={isSelected ? 'text-stone-900 dark:text-neon-teal' : 'text-stone-400'} />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen && node.isDirectory && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              depth={depth + 1}
              onLoadChildren={onLoadChildren}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ initialNodes, onFileSelect, selectedFile }) => {
  const [nodes, setNodes] = useState<FileNode[]>(initialNodes);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menu]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 180);
    setMenu({ x, y, path: node.path, name: node.name, isDirectory: node.isDirectory });
  }, []);

  const loadChildren = useCallback(async (parentNode: FileNode): Promise<void> => {
    if (!parentNode.path) return;

    try {
      const result = await window.electron.readDir(parentNode.path);
      if (!result.success || !result.files) {
        return;
      }

      const children: FileNode[] = result.files
        .map(entry => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.isDirectory,
          children: undefined,
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      setNodes(current => {
        const updateNode = (nodeList: FileNode[]): FileNode[] => {
          return nodeList.map(n => {
            if (n.path === parentNode.path) {
              return { ...n, children };
            }
            if (n.children) {
              return { ...n, children: updateNode(n.children) };
            }
            return n;
          });
        };
        return updateNode(current);
      });
    } catch (error) {
      console.error(`Error loading children for ${parentNode.path}:`, error);
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (!menu || menu.isDirectory) return;
    onFileSelect(menu.path);
    setMenu(null);
  }, [menu, onFileSelect]);

  const handleReveal = useCallback(async () => {
    if (!menu) return;
    setMenu(null);
    const target = menu.isDirectory ? await window.electron.openPath(menu.path) : await window.electron.showItemInFolder(menu.path);
    if (!target.success) {
      console.error('Reveal failed:', target.error);
    }
  }, [menu]);

  const handleRename = useCallback(async () => {
    if (!menu) return;
    const oldPath = menu.path;
    const oldName = menu.name;
    setMenu(null);
    const newName = window.prompt(`Rename ${oldName} to:`, oldName);
    if (!newName || newName === oldName) return;
    const result = await window.electron.renamePath({ oldPath, newName });
    if (!result.success) {
      window.alert(`Rename failed: ${result.error ?? 'unknown error'}`);
    }
  }, [menu]);

  const handleDelete = useCallback(async () => {
    if (!menu) return;
    const target = menu.path;
    const name = menu.name;
    setMenu(null);
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    const result = await window.electron.deletePath({ targetPath: target });
    if (!result.success) {
      window.alert(`Delete failed: ${result.error ?? 'unknown error'}`);
    }
  }, [menu]);

  return (
    <div className="flex flex-col h-full border-r border-stone-200 dark:border-slate-800 w-64 bg-paper dark:bg-charcoal transition-colors duration-300">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-slate-800">
        <Folder size={16} className="text-stone-400" />
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {nodes.length === 0 ? (
          <div className="px-4 py-6 text-xs text-slate-400 dark:text-stone-500">
            No folder open. Use the header button to choose one.
          </div>
        ) : (
          nodes.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              depth={0}
              onLoadChildren={loadChildren}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-48 rounded-md border border-stone-200 dark:border-stone-300 dark:border-slate-700 bg-paper dark:bg-charcoal shadow-lg py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          {!menu.isDirectory && (
            <button
              onClick={handleOpen}
              className="w-full text-left px-3 py-1.5 hover:bg-paper-soft dark:hover:bg-slate-800 flex items-center gap-2"
              role="menuitem"
            >
              <FileText size={14} className="text-stone-400" />
              Open
            </button>
          )}
          <button
            onClick={handleReveal}
            className="w-full text-left px-3 py-1.5 hover:bg-paper-soft dark:hover:bg-slate-800 flex items-center gap-2"
            role="menuitem"
          >
            <Folder size={14} className="text-stone-400" />
            {menu.isDirectory ? 'Open in file manager' : 'Reveal in folder'}
          </button>
          <div className="my-1 border-t border-stone-200 dark:border-stone-300 dark:border-slate-700" />
          <button
            onClick={handleRename}
            className="w-full text-left px-3 py-1.5 hover:bg-paper-soft dark:hover:bg-slate-800 flex items-center gap-2"
            role="menuitem"
          >
            <Pencil size={14} className="text-stone-400" />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center gap-2"
            role="menuitem"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
