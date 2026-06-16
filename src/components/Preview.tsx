import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface PreviewProps {
  content: string;
  currentFile: string | null;
}

function resolveAssetUrl(src: string, currentFile: string | null): string {
  if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('nexus-asset://')) return src;
  if (!currentFile) return src;

  const isWindowsAbs = /^[A-Za-z]:[\\/]/.test(src);
  const isPosixAbs = src.startsWith('/');
  if (isWindowsAbs) {
    return 'nexus-asset:///' + src.replace(/^[\\/]+/, '').replace(/\\/g, '/');
  }
  if (isPosixAbs) {
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
  const combined = (dir ? dir + '/' : '') + src;
  return 'nexus-asset:///' + collapsePath(combined).replace(/^[\\/]+/, '');
}

function collapsePath(input: string): string {
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
}

const HighlightedCode: React.FC<{ inline?: boolean; className?: string; children?: React.ReactNode }> = ({ inline, className, children, ...props }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const match = /language-(\w+)/.exec(className || '');
  const codeText = String(children);
  const copyKey = match ? `${match[1]}:${codeText.slice(0, 40)}` : `inline:${codeText.slice(0, 40)}`;
  return !inline && match ? (
    <div className="relative group my-6">
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => {
            navigator.clipboard.writeText(codeText.trim());
            setCopiedKey(copyKey);
            setTimeout(() => setCopiedKey(null), 2000);
          }}
          className="p-2 bg-slate-800/80 backdrop-blur-sm text-stone-500 hover:text-white rounded-lg transition-colors"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copiedKey === copyKey ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <SyntaxHighlighter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={oneDark as any}
        language={match[1]}
        PreTag="div"
        className="rounded-xl !mt-0 border border-stone-200 dark:border-slate-800 shadow-sm"
        {...props}
      >
        {codeText.trim()}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="bg-paper-soft dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-clay dark:text-neonTeal" {...props}>
      {children}
    </code>
  );
};

export const Preview: React.FC<PreviewProps> = ({ content = '', currentFile = null }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-paper-soft dark:bg-slate-900/30 border-b border-stone-200 dark:border-slate-800">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Transmission</span>
      </div>
      <div className="flex-1 overflow-y-auto p-8 md:p-16 bg-paper dark:bg-obsidian">
        <div className="max-w-3xl mx-auto markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: HighlightedCode,
              img: ({ src, alt }) => (
                <img
                  src={resolveAssetUrl(src ?? '', currentFile)}
                  alt={alt ?? ''}
                  className="max-w-full h-auto rounded-lg my-6 shadow-sm"
                  loading="lazy"
                />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-8">
                  <table className="w-full border-collapse text-sm border border-stone-200 dark:border-slate-800">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-stone-200 dark:border-slate-800 px-4 py-3 bg-paper-soft dark:bg-slate-900/50 font-bold text-left text-slate-600 dark:text-stone-500 uppercase tracking-tight">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-stone-200 dark:border-slate-800 px-4 py-3 leading-relaxed">{children}</td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-clay dark:border-stone-300 dark:border-slate-700 pl-6 py-1 italic text-slate-600 dark:text-stone-500 my-8 text-lg leading-relaxed">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => <h1 className="text-5xl font-bold mb-8 mt-12 pb-4 border-b border-stone-200 dark:border-slate-800">{children}</h1>,
              h2: ({ children }) => <h2 className="text-3xl font-semibold mb-6 mt-10">{children}</h2>,
              h3: ({ children }) => <h3 className="text-2xl font-medium mb-4 mt-8">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-3">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-3">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              p: ({ children }) => <p className="mb-6 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
