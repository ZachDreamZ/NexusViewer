import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createMarkdownComponents } from '../lib/markdown';

interface PreviewProps {
  content: string;
  currentFile: string | null;
}

export const Preview: React.FC<PreviewProps> = ({ content = '', currentFile = null }) => {
  const components = createMarkdownComponents(currentFile);
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
};
