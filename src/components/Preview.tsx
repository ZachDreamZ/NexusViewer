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
  if (src.startsWith('/')) return 'nexus-asset://' + src;
  return 'nexus-asset:///' + collapsePath((dir + '/' + src).replace(/^\/+/, '')).replace(/^[\\/]+/, '');
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
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => {
            navigator.clipboard.writeText(codeText.trim());
            setCopiedKey(copyKey);
            setTimeout(() => setCopiedKey(null), 2000);
          }}
          className="p-1.5 rounded-md bg-foreground/80 backdrop-blur-sm text-background/80 hover:text-background transition-colors"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copiedKey === copyKey ? <Check size={12} className="text-success" /> : <Copy size={12} />}
        </button>
      </div>
      <SyntaxHighlighter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={oneDark as any}
        language={match[1]}
        PreTag="div"
        className="rounded-lg !mt-0 border border-border shadow-sm overflow-hidden"
        {...props}
      >
        {codeText.trim()}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-callout font-mono" {...props}>
      {children}
    </code>
  );
};

export const Preview: React.FC<PreviewProps> = ({ content = '', currentFile = null }) => {
  return (
    <section
      className="flex flex-col h-full flex-1 min-w-0 bg-background"
      aria-label="Markdown preview"
    >
      <div className="flex items-center gap-2 h-9 px-4 border-b border-border">
        <span className="text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider">
          Preview
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-12 py-10 bg-background">
        <div className="max-w-3xl mx-auto markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: HighlightedCode,
              img: ({ src, alt }) => (
                <img
                  src={resolveAssetUrl(src ?? '', currentFile)}
                  alt={alt ?? ''}
                  className="max-w-full h-auto rounded-lg my-6 shadow-sm border border-border"
                  loading="lazy"
                />
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-8 rounded-lg border border-border overflow-hidden">
                  <table className="w-full border-collapse text-body">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border-b border-border px-4 py-2.5 bg-muted text-left text-caption-1 font-semibold text-foreground uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-border px-4 py-3 text-body">
                  {children}
                </td>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary pl-4 py-1 italic text-muted-foreground my-6">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => <h1 className="text-large-title font-bold mb-6 mt-10 pb-3 border-b border-border first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-title-1 font-semibold mb-4 mt-8 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-title-2 font-semibold mb-3 mt-6 first:mt-0">{children}</h3>,
              h4: ({ children }) => <h4 className="text-title-3 font-semibold mb-2 mt-6 first:mt-0">{children}</h4>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              hr: () => <hr className="my-8 border-border" />,
              a: ({ children, href }) => (
                <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer noopener">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
};
