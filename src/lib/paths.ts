const WINDOWS_ABS = /^[A-Za-z]:[\\/]/;

const collapsePath = (input: string): string => {
  const parts = input.split('/').filter(p => p !== '');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
};

export const resolveAssetUrl = (src: string | undefined | null, currentFile: string | null | undefined): string => {
  if (!src) return src ?? '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('nexus-asset://')) return src;
  if (!currentFile) return src;

  if (WINDOWS_ABS.test(src)) {
    return 'nexus-asset:///' + src.replace(/^[\\/]+/, '').replace(/\\/g, '/');
  }
  if (src.startsWith('/')) {
    return 'nexus-asset://' + src;
  }

  const normalized = currentFile.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
  const driveMatch = normalized.match(/^([A-Za-z]:)/);
  if (driveMatch) {
    const drive = driveMatch[1];
    const restDir = dir ? dir.slice(2) : '';
    const combined = restDir ? `${drive}/${restDir}/${src}` : `${drive}/${src}`;
    const resolved = collapsePath(combined.replace(/\\/g, '/'));
    return 'nexus-asset:///' + resolved.replace(/^[\\/]+/, '');
  }
  const protocolIdx = normalized.indexOf('://');
  if (protocolIdx !== -1) {
    const prefix = normalized.slice(0, protocolIdx + 3);
    const netPath = normalized.slice(protocolIdx + 3);
    const baseDir = netPath.includes('/') ? netPath.slice(0, netPath.lastIndexOf('/')) : '';
    return prefix + collapsePath((baseDir ? baseDir + '/' : '') + src);
  }
  return 'nexus-asset:///' + collapsePath((dir + '/' + src).replace(/^\/+/, '')).replace(/^[\\/]+/, '');
};
