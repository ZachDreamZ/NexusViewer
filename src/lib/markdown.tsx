import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { resolveAssetUrl } from './paths';
import { CodeBlock } from './CodeBlock';
import { cn } from './utils';

export const createMarkdownComponents = (
  currentFile: string | null | undefined,
  options: { withSyntaxHighlight?: boolean } = {},
) => {
  const { withSyntaxHighlight = true } = options;
  return {
    code({ inline, className, children, ...props }: {
      inline?: boolean;
      className?: string;
      children?: ReactNode;
    } & ComponentPropsWithoutRef<'code'>) {
      const match = /language-(\w+)/.exec(className || '');
      const text = String(children);
      if (!inline && match) {
        if (withSyntaxHighlight) {
          return <CodeBlock language={match[1]} className={className}>{text}</CodeBlock>;
        }
        return (
          <code
            className={cn('block bg-muted border border-border p-4 rounded-lg text-body font-mono my-4 overflow-x-auto whitespace-pre', className)}
            {...props}
          >
            {text}
          </code>
        );
      }
      return (
        <code
          className={cn('bg-muted text-foreground px-1.5 py-0.5 rounded text-callout font-mono', className)}
          {...(props as ComponentPropsWithoutRef<'code'>)}
        >
          {children}
        </code>
      );
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img
        src={resolveAssetUrl(src, currentFile)}
        alt={alt ?? ''}
        className="max-w-full h-auto rounded-lg my-6 shadow-sm border border-border"
        loading="lazy"
      />
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:opacity-80"
        target="_blank"
        rel="noreferrer noopener"
      >
        {children}
      </a>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-large-title font-bold mb-6 mt-10 pb-3 border-b border-border first:mt-0">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-title-1 font-semibold mb-4 mt-8 first:mt-0">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-title-2 font-semibold mb-3 mt-6 first:mt-0">{children}</h3>
    ),
    h4: ({ children }: { children?: ReactNode }) => (
      <h4 className="text-title-3 font-semibold mb-2 mt-6 first:mt-0">{children}</h4>
    ),
    p: ({ children }: { children?: ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-primary pl-4 py-1 italic text-muted-foreground my-6">{children}</blockquote>
    ),
    table: ({ children }: { children?: ReactNode }) => (
      <div className="overflow-x-auto my-8 rounded-lg border border-border overflow-hidden">
        <table className="w-full border-collapse text-body">{children}</table>
      </div>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="border-b border-border px-4 py-2.5 bg-muted text-left text-caption-1 font-semibold text-foreground uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="border-b border-border px-4 py-3 text-body">{children}</td>
    ),
    hr: () => <hr className="my-8 border-border" />,
  } as const;
};
