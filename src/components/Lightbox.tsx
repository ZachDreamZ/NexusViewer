import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  open: boolean;
  sources: LightboxImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  open,
  sources,
  index,
  onClose,
  onPrev,
  onNext,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onPrev, onNext]);

  if (!open || sources.length === 0) return null;

  const current = sources[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-md bg-card/90 hover:bg-card text-foreground border border-border transition-colors duration-200 ease-out shadow-sm"
        aria-label="Close image viewer"
      >
        <X size={16} />
      </button>

      {sources.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-md bg-card/90 hover:bg-card text-foreground border border-border transition-colors duration-200 ease-out shadow-sm"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-md bg-card/90 hover:bg-card text-foreground border border-border transition-colors duration-200 ease-out shadow-sm"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <figure
        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt}
          className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl border border-border"
        />
        {(current.alt || sources.length > 1) && (
          <figcaption className="flex flex-col items-center gap-1">
            {current.alt && (
              <span className="text-caption-1 text-background font-medium">
                {current.alt}
              </span>
            )}
            {sources.length > 1 && (
              <span className="text-caption-2 text-background/70 font-mono tabular-nums">
                {index + 1} / {sources.length}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </div>
  );
};
