import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkCallout } from '../lib/remarkCallout';
import welcomeContent from '../content/welcome.md?raw';
import { createMarkdownComponents } from '../lib/markdown';
import { Logo } from './Logo';
import { FolderOpen } from './Icons';

interface WelcomeProps {
  onChooseFolder?: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onChooseFolder }) => {
  const components = createMarkdownComponents(null, { withSyntaxHighlight: false });
  return (
    <div className="flex-1 h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-12 py-16">
        <div className="flex items-start justify-between gap-6 mb-10">
          <Logo size={64} large />
          <button
            onClick={onChooseFolder}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 ease-out text-body font-medium shadow-sm"
          >
            <FolderOpen size={14} />
            Open Folder
          </button>
        </div>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkCallout]} components={components}>
            {welcomeContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
