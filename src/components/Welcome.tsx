import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import welcomeContent from '../content/welcome.md?raw';
import logo from '../assets/logo.svg';
import { FolderOpen } from 'lucide-react';

export const Welcome: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-obsidian">
      <div className="max-w-3xl mx-auto px-8 md:px-16 py-12 markdown-body">
        <div className="flex items-start justify-between gap-4 mb-8">
          <img
            src={logo}
            alt="NexusViewer"
            width={72}
            height={72}
            className="w-18 h-18 shrink-0 drop-shadow-[0_0_12px_rgba(0,242,255,0.25)]"
          />
          <button
            onClick={() => window.electron.chooseFolder()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-neon-teal/10 text-neon-teal border border-neon-teal/30 hover:bg-neon-teal/20 transition-colors text-sm font-medium shrink-0"
          >
            <FolderOpen size={14} />
            Open Folder
          </button>
        </div>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-5xl font-bold mb-8 mt-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-3xl font-semibold mb-6 mt-10">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-2xl font-medium mb-4 mt-8">{children}</h3>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-8">
                <table className="w-full border-collapse text-sm border border-slate-200 dark:border-slate-800">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 font-bold text-left text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-slate-200 dark:border-slate-800 px-4 py-3 leading-relaxed">
                {children}
              </td>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-clay dark:border-slate-700 pl-6 py-1 italic text-slate-600 dark:text-slate-400 my-8 text-lg leading-relaxed">
                {children}
              </blockquote>
            ),
            ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-3">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-3">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            p: ({ children }) => <p className="mb-6 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>,
            code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode } & React.HTMLAttributes<HTMLElement>) {
              const match = /language-(\w+)/.exec(className || '');
              const text = String(children);
              if (!inline && match) {
                return (
                  <code
                    className="block bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-lg text-sm font-mono my-4 overflow-x-auto whitespace-pre"
                    {...props}
                  >
                    {text}
                  </code>
                );
              }
              return (
                <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-clay dark:text-neonTeal" {...props}>
                  {children}
                </code>
              );
            },
            hr: () => <hr className="my-12 border-slate-200 dark:border-slate-800" />,
          }}
        >
          {welcomeContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};
