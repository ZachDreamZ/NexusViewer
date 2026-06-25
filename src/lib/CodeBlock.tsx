import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { cn } from './utils';

type OneDarkStyle = Record<string, Record<string, unknown>>;
const oneDarkStyle = oneDark as OneDarkStyle;

interface CodeBlockProps {
  language: string;
  className?: string;
  children: ReactNode;
}

export const CodeBlock = ({ language, className, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const text = String(children);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative group my-6">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => {
            void navigator.clipboard.writeText(text.trim());
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 2000);
          }}
          className="p-1.5 rounded-md bg-foreground/80 backdrop-blur-sm text-background/80 hover:text-background transition-colors"
          title="Copy code"
          aria-label="Copy code to clipboard"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDarkStyle}
        language={language}
        PreTag="div"
        className={cn('rounded-lg !mt-0 border border-border shadow-sm overflow-hidden', className)}
      >
        {text.trim()}
      </SyntaxHighlighter>
    </div>
  );
};
