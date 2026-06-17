import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { createMarkdownComponents } from '../lib/markdown';
import { Lightbox, type LightboxImage } from './Lightbox';

interface PreviewProps {
  content: string;
  currentFile: string | null;
}

const extractImages = (markdown: string): LightboxImage[] => {
  const images: LightboxImage[] = [];
  const mdImage = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImage.exec(markdown)) !== null) {
    images.push({ src: m[2], alt: m[1] });
  }
  const htmlImage = /<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/g;
  while ((m = htmlImage.exec(markdown)) !== null) {
    images.push({ src: m[1], alt: m[2] });
  }
  return images;
};

export const Preview: React.FC<PreviewProps> = ({ content = '', currentFile = null }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imageSources = useMemo(() => extractImages(content), [content]);

  const handleImageClick = useCallback(
    (index: number) => {
      if (imageSources.length === 0) return;
      setLightboxIndex(index);
      setLightboxOpen(true);
    },
    [imageSources.length]
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevImage = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + imageSources.length) % imageSources.length);
  }, [imageSources.length]);
  const nextImage = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % imageSources.length);
  }, [imageSources.length]);

  const components = createMarkdownComponents(currentFile, { onImageClick: handleImageClick });

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
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <Lightbox
        open={lightboxOpen}
        sources={imageSources}
        index={lightboxIndex}
        onClose={closeLightbox}
        onPrev={prevImage}
        onNext={nextImage}
      />
    </section>
  );
};
