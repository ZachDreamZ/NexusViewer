import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

interface MermaidBlockProps {
  code: string;
  className?: string;
}

type MermaidModule = typeof import('mermaid').default;

let mermaidPromise: Promise<MermaidModule> | null = null;
const loadMermaid = (): Promise<MermaidModule> => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default);
  }
  return mermaidPromise;
};

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className }) => {
  const [darkMode] = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++counterRef.current}`;

    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'inherit',
          themeVariables: darkMode
            ? {
                background: 'transparent',
                primaryColor: '#1f2937',
                primaryTextColor: '#e5e7eb',
                primaryBorderColor: '#475569',
                lineColor: '#94a3b8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
              }
            : {
                background: 'transparent',
                primaryColor: '#f1f5f9',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#cbd5e1',
                lineColor: '#64748b',
                secondaryColor: '#e2e8f0',
                tertiaryColor: '#f8fafc',
              },
        });
        const result = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to render diagram');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, darkMode]);

  if (error) {
    return (
      <div
        role="alert"
        className="my-4 p-3 border border-destructive/40 bg-destructive/10 text-destructive rounded-lg text-caption-1 font-mono"
      >
        Mermaid error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        aria-busy="true"
        className={cn(
          'my-4 p-6 bg-muted border border-border rounded-lg text-caption-1 text-muted-foreground animate-pulse text-center',
          className
        )}
      >
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mermaid-block my-6 p-4 bg-card border border-border rounded-lg overflow-x-auto flex justify-center',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
