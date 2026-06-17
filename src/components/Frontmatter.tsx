import { useState } from 'react';
import yaml from 'js-yaml';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface FrontmatterProps {
  content: string;
}

export const Frontmatter: React.FC<FrontmatterProps> = ({ content = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const parseFrontmatter = (text: string): Record<string, unknown> | null => {
    const regex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*([\r\n]+|$)/;
    const match = text.match(regex);
    if (match) {
      try {
        return yaml.load(match[1]) as Record<string, unknown>;
      } catch (e) {
        console.error('Error parsing YAML frontmatter', e);
      }
    }
    return null;
  };

  const data = parseFrontmatter(content);

  if (!data) return null;

  return (
    <div className="border-b border-border bg-card transition-all duration-200 ease-out">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between h-9 px-4 hover:bg-accent transition-colors duration-200 ease-out group"
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
          <span className="text-caption-1 font-semibold text-muted-foreground uppercase tracking-wider">
            Metadata
          </span>
          <span className="text-caption-2 text-muted-foreground/60 ml-1">
            {Object.keys(data).length} {Object.keys(data).length === 1 ? 'field' : 'fields'}
          </span>
        </div>
        <Info size={11} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </button>

      {isOpen && (
        <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <span className="text-caption-2 font-semibold text-muted-foreground uppercase tracking-wider">
                {key}
              </span>
              <span className="text-caption-1 text-foreground truncate font-medium">
                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
