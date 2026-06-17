import type { Root } from 'mdast';

type RemarkPlugin = () => (tree: Root) => void;

const CALLOUT_REGEX = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

interface MdastNode {
  type: string;
  value?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
  children?: MdastNode[];
}

const collect = (node: MdastNode, type: string, out: MdastNode[]): void => {
  if (node.type === type) out.push(node);
  if (node.children) {
    for (const child of node.children) collect(child, type, out);
  }
};

export const remarkCallout: RemarkPlugin = () => {
  return (tree) => {
    const blockquotes: MdastNode[] = [];
    collect(tree as unknown as MdastNode, 'blockquote', blockquotes);

    for (const node of blockquotes) {
      const firstChild = node.children?.[0];
      if (!firstChild || firstChild.type !== 'paragraph') continue;

      const firstInline = firstChild.children?.[0];
      if (!firstInline || firstInline.type !== 'text' || !firstInline.value) continue;

      const match = firstInline.value.match(CALLOUT_REGEX);
      if (!match) continue;

      const type = match[1].toUpperCase();
      firstInline.value = firstInline.value.replace(CALLOUT_REGEX, '');

      if (!firstInline.value && firstChild.children) {
        firstChild.children.shift();
        if (firstChild.children.length === 0 && node.children) {
          node.children.shift();
        }
      }

      node.data = node.data ?? {};
      node.data.hProperties = {
        ...(node.data.hProperties ?? {}),
        'data-callout-type': type,
      };
    }
  };
};
