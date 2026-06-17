export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const buildTree = (entries: readonly FileEntry[]): FileNode[] =>
  [...entries]
    .map<FileNode>(entry => ({
      name: entry.name,
      path: entry.path,
      isDirectory: entry.isDirectory,
      children: undefined,
    }))
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

const updateNodeInTree = (
  nodes: FileNode[],
  path: string,
  updater: (node: FileNode) => FileNode,
): FileNode[] =>
  nodes.map(n => {
    if (n.path === path) return updater(n);
    if (n.children) return { ...n, children: updateNodeInTree(n.children, path, updater) };
    return n;
  });

export const updateTreeNode = (
  nodes: FileNode[],
  path: string,
  updater: (node: FileNode) => FileNode,
): FileNode[] => updateNodeInTree(nodes, path, updater);
