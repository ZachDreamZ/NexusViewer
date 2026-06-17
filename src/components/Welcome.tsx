import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import welcomeContent from '../content/welcome.md?raw';
import logo from '../assets/logo.svg';
import { FolderOpen } from './Icons';

export const Welcome: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex items-start justify-between gap-6 mb-10">
          <img
            src={logo}
            alt="NexusViewer"
            width={64}
            height={64}
            className="w-16 h-16 shrink-0"
            style={{ filter: 'drop-shadow(0 0 16px var(--color-neon-cyan-glow))' }}
          />
          <button
            onClick={() => window.electron.chooseFolder()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 ease-out text-body font-medium shadow-sm"
          >
            <FolderOpen size={14} />
            Open Folder
          </button>
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-large-title font-bold mb-8 pb-4 border-b border-border">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-title-1 font-semibold mb-4 mt-10 flex items-center gap-2 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-title-2 font-semibold mb-3 mt-8 flex items-center gap-2 first:mt-0">
                {children}
              </h3>
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
            ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
            code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
              const match = /language-(\w+)/.exec(className || '');
              const text = String(children);
              if (!inline && match) {
                return (
                  <code
                    className="block bg-muted border border-border p-4 rounded-lg text-body font-mono my-4 overflow-x-auto whitespace-pre"
                    {...props}
                  >
                    {text}
                  </code>
                );
              }
              return (
                <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-callout font-mono" {...props}>
                  {children}
                </code>
              );
            },
            hr: () => <hr className="my-10 border-border" />,
          }}
        >
          {welcomeContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};
