import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

const onAnchorClick = (e: React.MouseEvent, id: string) => {
  e.preventDefault();
  window.history.replaceState(null, '', `#${id}`);
  void navigator.clipboard?.writeText(window.location.href);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Anchor: React.FC<{ id: string }> = ({ id }) => (
  <a
    href={`#${id}`}
    className="heading-anchor opacity-0 ml-2 text-muted-foreground no-underline font-normal transition-opacity duration-150 ease-out"
    aria-label="Link to this section"
    onClick={(e) => onAnchorClick(e, id)}
  >
    #
  </a>
);

const headingClass = {
  1: 'text-large-title font-bold mb-6 mt-10 pb-3 border-b border-border first:mt-0',
  2: 'text-title-1 font-semibold mb-4 mt-8 first:mt-0',
  3: 'text-title-2 font-semibold mb-3 mt-6 first:mt-0',
  4: 'text-title-3 font-semibold mb-2 mt-6 first:mt-0',
} as const;

export const Heading1: React.FC<{ children?: ReactNode; id?: string }> = ({ children, id }) => (
  <h1 id={id} className={cn(headingClass[1], 'group')}>
    {children}
    {id && <Anchor id={id} />}
  </h1>
);

export const Heading2: React.FC<{ children?: ReactNode; id?: string }> = ({ children, id }) => (
  <h2 id={id} className={cn(headingClass[2], 'group')}>
    {children}
    {id && <Anchor id={id} />}
  </h2>
);

export const Heading3: React.FC<{ children?: ReactNode; id?: string }> = ({ children, id }) => (
  <h3 id={id} className={cn(headingClass[3], 'group')}>
    {children}
    {id && <Anchor id={id} />}
  </h3>
);

export const Heading4: React.FC<{ children?: ReactNode; id?: string }> = ({ children, id }) => (
  <h4 id={id} className={cn(headingClass[4], 'group')}>
    {children}
    {id && <Anchor id={id} />}
  </h4>
);
