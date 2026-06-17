export const slugifyHeading = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

type HeadingChild = string | number | { props?: { children?: HeadingChild } } | HeadingChild[] | null | undefined | boolean;

export const extractHeadingText = (node: unknown): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractHeadingText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractHeadingText((node as { props: { children?: HeadingChild } }).props.children);
  }
  return '';
};
