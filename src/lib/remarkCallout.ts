import type { Plugin } from 'unified';
import type { Root } from 'mdast';

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

const walk = function* (node: MdastNode): Generator<MdastNode> {
  yield node;
  if (node.children) {
    for (const child of node.children) yield* walk(child);
  }
};

export const remarkCallout: Plugin<[], Root> = () => {
  return (tree) => {
    for (const node of walk(tree as unknown as MdastNode)) {
      if (node.type !== 'blockquote') continue;

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
