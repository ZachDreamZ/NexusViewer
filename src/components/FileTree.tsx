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

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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
        className={cn(
          "w-full flex items-center gap-2 py-1 text-body transition-colors duration-200 ease-out disabled:opacity-50",
          isSelected
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
        )}
        style={{ paddingLeft: `${(depth * 12) + 12}px`, paddingRight: '12px' }}
      >
        <span className="w-3.5 flex items-center justify-center shrink-0">
          {node.isDirectory ? (
            isLoading ? (
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-pulse" />
            ) : isOpen ? (
              <ChevronDown size={12} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={12} className="text-muted-foreground" />
            )
          ) : null}
        </span>
        {node.isDirectory ? (
          <Folder size={13} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
        ) : (
          <FileText size={13} className={cn("shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
        )}
        <span className="truncate text-body">{node.name}</span>
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
    <aside
      className="frosted flex flex-col h-full w-60 border-r border-sidebar-border shrink-0 transition-colors duration-200 ease-out"
      role="navigation"
      aria-label="File explorer"
    >
      <div className="flex items-center gap-2 h-9 px-3 border-b border-sidebar-border">
        <Folder size={12} className="text-muted-foreground" />
        <span className="text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {nodes.length === 0 ? (
          <div className="px-3 py-6 text-caption-1 text-muted-foreground text-center">
            No folder open.
            <br />
            Use the header button to choose one.
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
          className="fixed z-50 min-w-44 rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl py-1 text-body"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          {!menu.isDirectory && (
            <button
              onClick={handleOpen}
              className="w-full text-left px-2.5 py-1 hover:bg-accent flex items-center gap-2 rounded-md mx-0.5"
              role="menuitem"
            >
              <FileText size={13} className="text-muted-foreground" />
              Open
            </button>
          )}
          <button
            onClick={handleReveal}
            className="w-full text-left px-2.5 py-1 hover:bg-accent flex items-center gap-2 rounded-md mx-0.5"
            role="menuitem"
          >
            <Folder size={13} className="text-muted-foreground" />
            {menu.isDirectory ? 'Open in file manager' : 'Reveal in folder'}
          </button>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleRename}
            className="w-full text-left px-2.5 py-1 hover:bg-accent flex items-center gap-2 rounded-md mx-0.5"
            role="menuitem"
          >
            <Pencil size={13} className="text-muted-foreground" />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-2.5 py-1 hover:bg-destructive/10 text-destructive flex items-center gap-2 rounded-md mx-0.5"
            role="menuitem"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </aside>
  );
};
