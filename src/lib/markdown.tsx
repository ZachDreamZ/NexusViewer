import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { resolveAssetUrl } from './paths';
import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from '../components/MermaidBlock';
import { Callout } from '../components/Callout';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
} from '../components/Heading';
import { extractHeadingText, slugifyHeading } from './headings';
import { cn } from './utils';

export const createMarkdownComponents = (
  currentFile: string | null | undefined,
  options: {
    withSyntaxHighlight?: boolean;
    onImageClick?: (index: number) => void;
  } = {}
) => {
  const { withSyntaxHighlight = true, onImageClick } = options;
  let imageIndex = 0;

  return {
    code({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children?: ReactNode;
    } & ComponentPropsWithoutRef<'code'>) {
      const match = /language-(\w+)/.exec(className || '');
      const text = String(children);
      if (!inline && match && match[1] === 'mermaid') {
        return <MermaidBlock code={text.replace(/\n$/, '')} />;
      }
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
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const idx = imageIndex++;
      const resolved = resolveAssetUrl(src, currentFile) ?? '';
      return (
        <img
          src={resolved}
          alt={alt ?? ''}
          className="max-w-full h-auto rounded-lg my-6 shadow-sm border border-border cursor-zoom-in transition-transform duration-200 ease-out hover:scale-[1.01]"
          loading="lazy"
          onClick={() => onImageClick?.(idx)}
        />
      );
    },
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
    h1: ({ children }: { children?: ReactNode }) => {
      const text = extractHeadingText(children);
      return <Heading1 id={text ? slugifyHeading(text) : undefined}>{children}</Heading1>;
    },
    h2: ({ children }: { children?: ReactNode }) => {
      const text = extractHeadingText(children);
      return <Heading2 id={text ? slugifyHeading(text) : undefined}>{children}</Heading2>;
    },
    h3: ({ children }: { children?: ReactNode }) => {
      const text = extractHeadingText(children);
      return <Heading3 id={text ? slugifyHeading(text) : undefined}>{children}</Heading3>;
    },
    h4: ({ children }: { children?: ReactNode }) => {
      const text = extractHeadingText(children);
      return <Heading4 id={text ? slugifyHeading(text) : undefined}>{children}</Heading4>;
    },
    p: ({ children }: { children?: ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-muted-foreground">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({
      children,
      node,
    }: {
      children?: ReactNode;
      node?: { properties?: Record<string, unknown> };
    }) => {
      const calloutType = node?.properties?.['dataCalloutType'] as string | undefined;
      if (calloutType) {
        return <Callout type={calloutType}>{children}</Callout>;
      }
      return (
        <blockquote className="border-l-2 border-primary pl-4 py-1 italic text-muted-foreground my-6">
          {children}
        </blockquote>
      );
    },
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
